"use strict";

const fetchBlog = pquire("api/fetch-blog");
const fetchPage = pquire("api/fetch-page");
const download = pquire("grab/download");

module.exports = async function(blog, dlmgr) {
  let page = null;
  let pi = 0;
  
  const info = await fetchBlog(blog);
  log.info(`Downloading ${info.total_posts} posts`);
  
  const pageSize = fetchPage.pageSize;
  
  let failed = [];
  
  dlmgr.startBlog(info, pageSize);
  
  do {
    dlmgr.startPage();
    
    page = await fetchPage(blog, pi++);
    for (const post of page) {
      dlmgr.startPost(post);
      
      const fld = await download(post, blog.name);
      const failures = fld.filter((e) => e != null);
      if (failures.length > 0) {
        failed.push({post: post.meta.id, errors: failures});
      }
      
      dlmgr.finishPost();
    }
    
    dlmgr.finishPage();
  
  // Stop when the length of the page is less than the max
  // this will only happen on the last page
  } while (page.length == pageSize);
  
  console.log(`${failed.length} post${failed.length == 1 ? "" : "s"} had failed downloads:`);
  console.log(failed);
  
  dlmgr.finishBlog();
};