// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Search the bookmarks when entering the search keyword.
$('#search').change(function () {
  $('#bookmarks').empty();
  dumpBookmarks($('#search').val());
});

// const bookmarkTree = chrome.bookmarks.getTree();
// console.log('bookmarkTree', bookmarkTree)

// console.log(getToDoFolderNode())
async function logFolder() {
  var toDoFolderNode = await getToDoFolderNode()
  console.log('toDoFolderNode', toDoFolderNode);
  var doneFolderNode = await getDoneFolderNode()
  console.log('doneFolderNode', doneFolderNode);
} 


async function getLinkToDoFolderNode() {
  var bookmarks = await chrome.bookmarks.getTree()
  otherBookmarks = bookmarks[0]['children'][1]['children']
  
  var linkToDoFolderNode = await otherBookmarks.filter((node) => node.title == "LinkToDo" )[0]

  if(linkToDoFolderNode ) {
    return linkToDoFolderNode
  } else   {
    var node = await chrome.bookmarks.create({
      parentId: "2",
      title: 'LinkToDo'
    })
    return node
  } 
}

async function getToDoFolderNode() {
  var linkToDoFolderNode = await getLinkToDoFolderNode()
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
  var linkToDoFolderNode = await getLinkToDoFolderNode()
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

// Traverse the bookmark tree, and print the folder and nodes.
async function dumpBookmarks(query) {
  $('#todo-bookmarks').empty()
  $('#done-bookmarks').empty()
  const linkToDoFolderNode = await getLinkToDoFolderNode()
  console.log('dumpBookmarks linkToDoFolderNode', linkToDoFolderNode);
  // ToDo Tree
  const toDoFolderNode = await getToDoFolderNode() // This might be enough to pass on
  console.log('dumpBookmarks toDoFolderNode', toDoFolderNode);
  const toDoBookmarkTreeNodes = await chrome.bookmarks.getSubTree(toDoFolderNode.id, function (
    toDoBookmarkTreeNodes
  ) {
    $('#todo-bookmarks').append(dumpTreeNodes(toDoBookmarkTreeNodes, query));
  });
  console.log('toDoBookmarkTreeNodes', toDoBookmarkTreeNodes);

  // Done Tree
  const doneFolderNode = await getDoneFolderNode() 
  const doneBookmarkTreeNodes = await chrome.bookmarks.getSubTree(doneFolderNode.id, function (
    doneBookmarkTreeNodes
  ) {
    $('#done-bookmarks').append(dumpTreeNodes(doneBookmarkTreeNodes, query));
  });
}

function dumpTreeNodes(bookmarkNodes, query) {
  if (bookmarkNodes[0].title == "ToDo" || bookmarkNodes[0].title == "Done") {
    var list = $('<div class="todoordone">');
  } else {
    var list = $('<ul>');
  }
  console.log('bookmarkNodes', bookmarkNodes);
  if (!bookmarkNodes) {
    return list
  }
  for (let i = 0; i < bookmarkNodes.length; i++) {
    list.append(dumpNode(bookmarkNodes[i], query));
  }

  return list;
}

function dumpNode(bookmarkNode, query) {
  let span = '';
  let includeBookmark = bookmarkNode.title && bookmarkNode.title != "ToDo" && bookmarkNode.title != "Done"
  if (includeBookmark) {
    if (query && !bookmarkNode.children) {
      if (
        String(bookmarkNode.title.toLowerCase()).indexOf(query.toLowerCase()) ==
        -1 
      ) {
        return $('<span></span>');
      }
    }

    const anchor = $('<a>');
    anchor.attr('href', bookmarkNode.url);
    anchor.text(bookmarkNode.title);

    /*
     * When clicking on a bookmark in the extension, a new tab is fired with
     * the bookmark url.
     */
    anchor.click(function () {
      chrome.tabs.create({ url: bookmarkNode.url });
    });

    span = $('<span>');
    const options = bookmarkNode.children
      ? $('<span>[<a href="#" id="addlink">Add</a>]</span>')
      : $(
          '<span>[<a id="donelink" href="#">Done</a> <a id="deletelink" ' +
            'href="#">Delete</a>]</span>'
        );
    const edit = bookmarkNode.children
      ? $(
          '<table><tr><td>Name</td><td>' +
            '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
            '</td></tr></table>'
        )
      : $('<input>');

    // Show add and edit links when hover over.
    span
      .hover(
        function () {
          span.append(options);
          $('#deletelink').click(function (event) {
            console.log(event);
            $('#deletedialog')
              .empty()
              .dialog({
                autoOpen: false,
                closeOnEscape: true,
                title: 'Confirm Deletion',
                modal: true,
                show: 'slide',
                position: {
                  my: 'left',
                  at: 'center',
                  of: event.target.parentElement.parentElement
                },
                buttons: {
                  'Yes, Delete It!': function () {
                    chrome.bookmarks.remove(String(bookmarkNode.id));
                    span.parent().remove();
                    $(this).dialog('destroy');
                  },
                  Cancel: function () {
                    $(this).dialog('destroy');
                  }
                }
              })
              .dialog('open');
          });
          $('#addlink').click(function (event) {
            edit.show();
            $('#adddialog')
              .empty()
              .append(edit)
              .dialog({
                autoOpen: false,
                closeOnEscape: true,
                title: 'Add New Bookmark',
                modal: true,
                show: 'slide',
                position: {
                  my: 'left',
                  at: 'center',
                  of: event.target.parentElement.parentElement
                },
                buttons: {
                  Add: function () {
                    edit.hide();
                    chrome.bookmarks.create({
                      parentId: bookmarkNode.id,
                      title: $('#title').val(),
                      url: $('#url').val()
                    });
                    $('#bookmarks').empty();
                    $(this).dialog('destroy');
                    window.dumpBookmarks();
                  },
                  Cancel: function () {
                    edit.hide();
                    $(this).dialog('destroy');
                  }
                }
              })
              .dialog('open');
          });
          $('#editlink').click(function (event) {
            edit.show();
            edit.val(anchor.text());
            $('#editdialog')
              .empty()
              .append(edit)
              .dialog({
                autoOpen: false,
                closeOnEscape: true,
                title: 'Edit Title',
                modal: true,
                show: 'fade',
                position: {
                  my: 'left',
                  at: 'center',
                  of: event.target.parentElement.parentElement
                },
                buttons: {
                  Save: function () {
                    edit.hide();
                    chrome.bookmarks.update(String(bookmarkNode.id), {
                      title: edit.val()
                    });
                    anchor.text(edit.val());
                    options.show();
                    $(this).dialog('destroy');
                  },
                  Cancel: function () {
                    edit.hide();
                    $(this).dialog('destroy');
                  }
                }
              })
              .dialog('open');
          });
          $('#donelink').click(async function (event) {
            let doneFolderNode = await getDoneFolderNode()
            console.log('doneFolderNode', doneFolderNode.id);
            chrome.bookmarks.move(String(bookmarkNode.id), {
              parentId: doneFolderNode.id
            });
            dumpBookmarks();

          });
          options.fadeIn();
        },

        // unhover
        function () {
          options.remove();
        }
      )
      .append(anchor);
  }

  const li = $(includeBookmark ? '<li>' : '<div>').append(span);

  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    li.append(dumpTreeNodes(bookmarkNode.children, query));
  }

  return li;
}

async function getCurrentTab() {
  let queryOptions = { active: true}; //, lastFocusedWindow: true 
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  console.log('tab inside', tab)
  return tab;
}

$('#add-todo').click(async function (event) {
  const toDoFolderNode = await getToDoFolderNode()

  const tab = await getCurrentTab();
    chrome.bookmarks.create({
      parentId: toDoFolderNode.id,
      title: tab?.title,
      url: tab?.url
    });
    window.dumpBookmarks();
  });

document.addEventListener('DOMContentLoaded', function () {
  dumpBookmarks();
});
