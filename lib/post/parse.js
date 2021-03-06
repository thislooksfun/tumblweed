"use strict";

const cheerio = require("cheerio");
const fetch = pquire("api/fetch");
const flatMap = require("flatmap");
const dedupe = require("dedupe");


function addWithType(p, type, src) {
  if (type.startsWith("video/")) {
    p.meta.files.push({folder: "videos", uri: src});
  } else if (type.startsWith("image/")) {
    p.meta.files.push({folder: "images", uri: src});
  } else if (type.startsWith("audio/")) {
    p.meta.files.push({folder: "audios", uri: src});
  } else {
    throw new Error(`Unsupported source type ${type}`);
  }
}

function common(post) {
  const trail = post.trail || [];
  
  const htmls = trail.map((itm) => itm.content || itm.content_abstract || "");
  const avatars = trail.map((itm) => ({folder: `_avatars/${itm.blog.name}`, uri: fetch.url(itm.blog.name, "avatar/512", {}, false)}));
  const headers = flatMap(trail, (itm) => {
    if (itm.blog.theme == null || itm.blog.theme.header_image == null) {
      return [];
    }
    return [
      {folder: `_headers/${itm.blog.name}`, uri: itm.blog.theme.header_image},
      {folder: `_headers/${itm.blog.name}`, uri: itm.blog.theme.header_image_focused},
      {folder: `_headers/${itm.blog.name}`, uri: itm.blog.theme.header_image_scaled},
    ];
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
      
      referenced_avatars: avatars,
      referenced_headers: headers,
      
      htmls: htmls,
      files: [],
    },
    
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
    p.meta.files.push({folder: "images", uri: el.attribs.src});
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
        p.meta.files.push({folder: "videos", uri: npf.url});
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
      p.meta.files.push({folder: "images", uri: el.attribs.poster});
    }
  },
  
  
  // Other
  iframe: function(/* p, el */) { throw new Error("Not Implemented -- submit an issue on GitHub"); },
};

/* Possible types:
  answer -- done
  audio  -- done(?)
  chat   -- done
  link   -- done(?)
  photo  -- done
  quote  -- done
  text   -- done
  video  -- done
*/
const formatters = {
  answer: function(post, p) {
    // I don't think questions can have HTML tags, but better safe than sorry!
    p.meta.htmls.push(post.question);
  },
  
  audio: function(post, p) {
    // No point in downloading external resources, those can just be linked to
    if (post.is_external) {
      return;
    }
    
    // TODO: Parse 'post.player' and 'post.embed' (iframes)?
    // p.meta.htmls.push(post.player);
    // p.meta.htmls.push(post.embed);
    p.meta.files.push({folder: "audios", uri: post.audio_url});
    p.meta.files.push({folder: "audios", uri: post.audio_source_url});
  },
  
  chat: function(post, p) {
    for (const entry of post.dialogue) {
      // I think chat posts are text-only, but better safe than sorry!
      p.meta.htmls.push(entry.name);
      p.meta.htmls.push(entry.label);
      p.meta.htmls.push(entry.phrase);
    }
  },
  
  link: function(post, p) {
    // 'link' posts have an array of photos -- previews of the link destination
    // 'photo' already processes that, so we delegate to it.
    if (post.images != null) {
      formatters.photo(post, p);
    }
    if (post.link_image != null) {
      p.meta.files.push({folder: "images", uri: post.link_image});
    }
  },
  
  photo: function(post, p) {
    for (const photo of post.photos) {
      p.meta.files.push({folder: "images", uri: photo.original_size.url});
    }
  },
  
  quote: function(post, p) {
    p.meta.htmls.push(post.text);
    p.meta.htmls.push(post.source);
  },
  
  text: function() {
    // No-op -- all data is already grabbed by common
  },
  
  video: function(post, p) {
    // No point in downloading external resources, those can just be linked to
    if (post.video_type !== "tumblr") {
      return;
    }
    
    p.meta.files.push({folder: "videos", uri: post.video_url});
  },
};

module.exports = function(post) {
  log.debug(`Parsing post ${post.id}`);
  
  const fmt = formatters[post.type];
  if (fmt == null) {
    log.fatal(`Missing formatter for post type ${post.type} (id: ${post.id})`);
  }
  
  const p = common(post);
  fmt(post, p);
  
  // Dedupe, just in case
  p.meta.htmls = dedupe(p.meta.htmls);
  
  for (const html of p.meta.htmls) {
    let $ = cheerio.load(html);
    let body = $("body");
    tagParsers._traverse(p, body, $);
  }
  
  // Dedupe, just in case
  p.meta.files = dedupe(p.meta.files);
  
  return p;
};