console.log('background.js');
// var bookmarks = ['one', 'two', 'three']

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
  if (message.action === 'get-bookmarks') {
    handleGetBookmarks(sendResponse)    
  }
  if (message.action === 'move-bookmark') {
    handleMoveBookmark(message, sendResponse)    
  }
  if (message.action === 'add-todo') {
    handleAddToDo(message, sendResponse)    
  }
  
  return true
});

const handleGetBookmarks = async (sendResponse) => {
  var toDoBookmarks = await getToDoFolderNode()
  console.log('toDoBookmarks', JSON.stringify(toDoBookmarks) );
  var doneBookmarks = await getDoneFolderNode()
  console.log('doneBookmarks', JSON.stringify(doneBookmarks) );

  sendResponse({"todo":toDoBookmarks.children,"done": doneBookmarks.children}) 
};

const handleMoveBookmark = async (message, sendResponse) => {
  console.log('message', message);
  if (!message.url) {
    return false
  }
  var url = message.url

  var toDoBookmarksNode = await getToDoFolderNode()
  console.log('toDoBookmarksNode', JSON.stringify(toDoBookmarksNode) );
  var doneBookmarksNode = await getDoneFolderNode()
  console.log('doneBookmarksNode', JSON.stringify(doneBookmarksNode) );  

  var bookmarksArr = await chrome.bookmarks.search({"url": url})
  console.log('bookmarksArr', bookmarksArr)

  if (message.target == 'todo') {  
    for (bookmark of bookmarksArr) {
      if (bookmark.parentId == doneBookmarksNode.id) {
        // Move it to 
        console.log('Move to ToDo');
        chrome.bookmarks.move(
          bookmark.id,
          {parentId: toDoBookmarksNode.id}
        )
        
        break;
      }  
    }
    

    sendResponse(true)
  } else if (message.target == 'done') {
    for (bookmark of bookmarksArr) {
      if (bookmark.parentId == toDoBookmarksNode.id) {
        // Move it to 
        console.log('Move to Done');
        chrome.bookmarks.move(
          bookmark.id,
          {parentId: doneBookmarksNode.id}
        )
      }
    }
    sendResponse(true)
  }
};


const handleAddToDo = async (message, sendResponse) => {  
  if (!message.linkUrl || ! message.pageUrl || !message.selectionText) {
    return false
  }

  info = {}
  info.linkUrl = message.linkUrl;
  info.pageUrl = message.pageUrl;
  info.selectionText = message.selectionText;

  addToDo(info);
};

chrome.contextMenus.create({
      title: "Add ToDo",
      contexts: ["link"],
      id: "link-to-do"
    });

chrome.contextMenus.onClicked.addListener(addToDo);
async function addToDo(info) {
  console.log(info)
  if(info.linkUrl) {
    var toDoFolderNode = await getToDoFolderNode()
    chrome.bookmarks.create({
      parentId: toDoFolderNode.id,
      title: info.selectionText || info.linkUrl,
      url: info.linkUrl
    })
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab) {
        chrome.tabs.sendMessage(activeTab.id, { 
          action: "add-checkbox", 
          linkUrl: info.linkUrl,
          pageUrl: info.pageUrl
        });
      }
    });
  }
}

async function getLinkToDoFolderTree() {
  var bookmarks = await chrome.bookmarks.getTree()
  var otherBookmarks = bookmarks[0]['children'][1]['children']
  var linkToDoFolderNode = otherBookmarks.filter((node) => node.title == "LinkToDo" )[0]
  if(linkToDoFolderNode ) {
    return linkToDoFolderNode
  } else   {
    var node = chrome.bookmarks.create({
      parentId: "2",
      title: 'LinkToDo'
    })
    return node
  }
}

async function getToDoFolderNode() {
  var linkToDoFolderNode = await getLinkToDoFolderTree()
  var toDoFolderNode = linkToDoFolderNode.children?.filter((node) => node.title == "ToDo" )[0]
  

  if(toDoFolderNode ) {
    console.log('toDoFolderNode', toDoFolderNode);
    return toDoFolderNode
  } else   {
    var node = await chrome.bookmarks.create({
      parentId: linkToDoFolderNode.id,
      title: 'ToDo'
    })
    return node
  } 
}

async function getDoneFolderNode() {
  var linkToDoFolderNode = await getLinkToDoFolderTree()
  var doneFolderNode = linkToDoFolderNode.children?.filter((node) => node.title == "Done" )[0]

  if(doneFolderNode ) {
    return doneFolderNode
  } else   {
    var node = await chrome.bookmarks.create({
      parentId: linkToDoFolderNode.id,
      title: 'Done'
    })
    return node
  }
}