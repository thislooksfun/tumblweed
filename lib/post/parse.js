"use strict";

const cheerio = require("cheerio");
const fetch = pquire("api/fetch");
// const {highestRes} = pquire("util/helpers");

// Gets the image URL with the highest resolution
// function getImageURL(post) {
//   return highestRes(post, "photo-url-");
// }

// Gets the video URL
// function getVideoURL(post) {
//   const player = post["video-player"];
//   const $ = cheerio.load(player);
//   return $("video source")[0].attribs.src;
// }

// Gets the video URL
// function getAudioURL() {
// // function getAudioURL(post) {
//   throw new Error("Not implemented");
// }

function common(post) {
  // console.log("\n=== caption ===");
  // console.log(post.caption);
  //
  // console.log("\n\n\n\n=== reblog comment ===");
  // console.log(post.reblog.comment);
  //
  // console.log("\n\n\n\n=== reblog tree ===");
  // console.log(post.reblog.tree_html);
  //
  // let i = 0;
  // for (const x of post.trail) {
  //   console.log(`\n\n\n\n=== trail ${++i} ===`);
  //   console.log(x.content);
  // }
  
  const trail = post.trail || [];
  
  const htmls = trail.map((itm) => itm.content);
  const files = trail.flatMap((itm) => {
    let itms = [{folder: `../../${itm.blog.name}/avatar`, uri: fetch.url(itm.blog.name, "avatar/512", {}, false)}];
    if (itm.blog.theme != null && itm.blog.theme.header_image != null) {
      itms.push({folder: `../../${itm.blog.name}/header`, uri: itm.blog.theme.header_image});
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
  _ignored: [
    // Control
    "html", "head", "body",
    // Positioning/grouping
    "div", "p", "blockquote", "figure",
    "ul", "ol", "li",
    "table", "tr", "th", "td",
    // Text formatting
    "b", "i", "br", "span", "strong",
    "small",
    "h1", "h2", "h3", "h4", "h5",
    "del", "ins",
    // Other
    "a",
  ],
  
  _traverse: function(p, el, $) {
    $(el).children().each((i, el) => {
      if (!tagParsers._parse(p, el, $)) {
        tagParsers._traverse(p, el, $);
      }
    });
  },
  
  _parse: function(p, el, $) {
    const tag = el.tagName;
    if (tagParsers._ignored.includes(tag)) {
      return;
    }
    
    const parser = tagParsers[tag];
    if (parser == null) {
      const $dummy = $("<div></div>");
      const item = $dummy.append(el).html();
      log.debug(`Failed to find parser for element ${item}`);
      log.fatal(`Missing parser for tag '${tag}'`);
    }
    
    // If the parser returns false, then we skip the children.
    return parser(p, el, $) === false;
  },
  
  img: function(p, el) {
    p.files.push({folder: "images", uri: el.attribs.src});
  },
  
  video: function(p, el, $) {
    p.files.push({folder: "videos", uri: $(el).children("source")[0].attribs.src});
    return false;  // Don't parse children of <video> element
  },
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
  
  // console.log(JSON.stringify(post, null, 2));
  // log.fatal("HALT-parse-1");
  
  const fmt = formatters[post.type];
  if (fmt == null) {
    log.fatal(`Missing formatter for post type ${post.type} (id: ${post.id})`);
  }
  
  let p = fmt(post);
  // console.log(JSON.stringify(p, null, 2));
  // log.fatal("HALT-parse-2");
  
  for (const html of p.htmls) {
    let $ = cheerio.load(html);
    let body = $("body");
    tagParsers._traverse(p, body, $);
  }
  
  // console.log(JSON.stringify(p, null, 2));
  // log.fatal("HALT-parse-3");
  
  return p;
};