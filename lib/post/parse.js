"use strict";

const cheerio = require("cheerio");
const fetch = pquire("api/fetch");
const flatMap = require("flatmap");
const dedupe = require("dedupe");


function addWithType(p, type, src) {
  if (type.startsWith("video/")) {
    p.files.push({folder: "videos", uri: src});
  } else if (type.startsWith("image/")) {
    p.files.push({folder: "images", uri: src});
  } else {
    throw new Error(`Unsupported source type ${type}`);
  }
}

function common(post) {
  const trail = post.trail || [];
  
  const htmls = trail.map((itm) => itm.content);
  const files = flatMap(trail, (itm) => {
    let itms = [{folder: `../../_avatars/${itm.blog.name}`, uri: fetch.url(itm.blog.name, "avatar/512", {}, false)}];
    if (itm.blog.theme != null && itm.blog.theme.header_image != null) {
      // TODO: Add other headers?
      itms.push({folder: `../../_headers/${itm.blog.name}`, uri: itm.blog.theme.header_image});
      itms.push({folder: `../../_headers/${itm.blog.name}`, uri: itm.blog.theme.header_image_focused});
      itms.push({folder: `../../_headers/${itm.blog.name}`, uri: itm.blog.theme.header_image_scaled});
    }
    return itms;
  });
  
  if (post.summary != null) {
    htmls.push(post.summary);
  }
  
  return {
    meta: {
      id: post.id,
      type: post.type,
      timestamp: post["unix-timestamp"],
      slug: post.slug,
      title: post.title,
      blog_name: post.blog_name,
    },
    
    htmls: htmls,
    files: files,
    
    raw: post,
  };
}

const tagParsers = {
  _traverse: function(p, el, $) {
    $(el).children().each((i, el) => {
      if (!tagParsers._parse(p, el, $)) {
        tagParsers._traverse(p, el, $);
      }
    });
  },
  
  _parse: function(p, el, $) {
    const tag = el.tagName;
    const parser = tagParsers[tag];
    if (typeof(parser) !== "function") {
      log.debug(`Skipping tag ${tag}`);
      return false;
    }
    
    log.debug(`Processing tag ${tag}`);
    // If the parser returns false, then we skip the children.
    return parser(p, el, $) === false;
  },
  
  
  // Images
  img: function(p, el) {
    p.files.push({folder: "images", uri: el.attribs.src});
  },
  map:    function(/* p, el */) { throw new Error("Support for tag 'map' not implemented -- submit an issue on GitHub"); },
  area:   function(/* p, el */) { throw new Error("Support for tag 'area' not implemented -- submit an issue on GitHub"); },
  canvas: function(/* p, el */) { throw new Error("Support for tag 'canvas' not implemented -- submit an issue on GitHub"); },
  
  figure: function(p, el) {
    const npf_str = el.attribs["data-npf"];
    if (npf_str == null) {
      return;
    }
    const npf = JSON.parse(npf_str);
    switch (npf.type) {
      case "video": {
        p.files.push({folder: "videos", uri: npf.url});
        for (const img of npf.poster) {
          addWithType(p, img.type, img.url);
        }
        break;
      }
    }
  },
  
  picture: function(/* p, el */) { throw new Error("Support for tag 'picture' not implemented -- submit an issue on GitHub"); },
  svg:     function(/* p, el */) { throw new Error("Support for tag 'svg' not implemented -- submit an issue on GitHub"); },
  
  
  // Audio/Video
  audio: function(/* p, el */) { throw new Error("Support for tag 'audio' not implemented -- submit an issue on GitHub"); },
  
  source: function(p, el) {
    addWithType(p, el.attribs.type, el.attribs.src);
  },
  
  track: function(/* p, el */) { throw new Error("Support for tag 'track' not implemented -- submit an issue on GitHub"); },
  
  video: function(p, el) {
    // Actual video is grabbed via <source>
    if (el.attribs.poster != null) {
      p.files.push({folder: "images", uri: el.attribs.poster});
    }
  },
  
  
  // Other
  iframe: function(/* p, el */) { throw new Error("Not Implemented -- submit an issue on GitHub"); },
};

// Possible types: text, quote, link, answer, video, audio, photo, chat
const formatters = {
  answer: function(post) {
    let p = common(post);
    // I don't think questions can have HTML tags, but better safe than sorry!
    p.htmls.push(post.question);
    return p;
  },
  
  // audio: function(post) {
  //   let p = common(post);
  //   p.audio_url = getAudioURL(post);
  //   p.body = post["audio-caption"];
  //   return p;
  // },
  
  photo: function(post) {
    let p = common(post);
    for (const photo of post.photos) {
      p.files.push({folder: "images", uri: photo.original_size.url});
    }
    return p;
  },
  
  text: function(post) {
    let p = common(post);
    return p;
  },
  
  video: function(post) {
    let p = common(post);
    p.files.push({folder: "videos", uri: post.video_url});
    return p;
  },
};

module.exports = function(post) {
  log.debug(`Parsing post ${post.id}`);
  
  const fmt = formatters[post.type];
  if (fmt == null) {
    log.fatal(`Missing formatter for post type ${post.type} (id: ${post.id})`);
  }
  
  let p = fmt(post);
  
  for (const html of p.htmls) {
    let $ = cheerio.load(html);
    let body = $("body");
    tagParsers._traverse(p, body, $);
  }
  
  // Dedupe, just in case
  p.files = dedupe(p.files);
  
  return p;
};