
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('lisener added');
  // Check the message type and update the DOM as needed
  if (message.action === 'add-checkbox') {
    // Update the DOM element
    var linkUrl = message.linkUrl;
    var pageUrl = message.pageUrl;
    console.log('linkUrl', linkUrl);
    console.log('pageUrl', pageUrl);

    var linkElements = document.querySelectorAll('a[href="' + linkUrl + '"]')
    console.log('linkElements', linkElements)
    console.log('linkElements.length', linkElements.length);
    if (linkElements.length == 0) {
      var fullUrl = new URL(linkUrl)
      linkElements = document.querySelectorAll('a[href="' + fullUrl.pathname + '"]')
      console.log('linkElements', linkElements);
    }
    if (linkElements.length > 0) {
      for( var linkElement of linkElements){
        console.log('add checkbox')
        addCheckbox(linkElement)
      }
    }
  }
});

function addCheckbox(linkElement, checked, position ) {
  position = position || 'beforebegin'
  checked = checked || false
  var toDoCheckbox = `<div class="ltd-checkbox-wrapper">
    <div class="ltd-cbx">
      <input type="checkbox" class='ltd-todo' />
      <label for="cbx-12"></label>
      <svg width="15" height="14" viewbox="0 0 15 14" fill="none">
        <path d="M2 8.36364L6.23077 12L13 2"></path>
      </svg>
    </div>
    <!-- Gooey-->
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
      <defs>
        <filter id="goo-12">
          <fegaussianblur in="SourceGraphic" stddeviation="4" result="blur"></fegaussianblur>
          <fecolormatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" result="goo-12"></fecolormatrix>
          <feblend in="SourceGraphic" in2="goo-12"></feblend>
        </filter>
      </defs>
    </svg>
  </div>`

  linkElement.insertAdjacentHTML(position, toDoCheckbox)
  var checkbox = linkElement.previousElementSibling.getElementsByTagName('input')[0]
  checkbox.value = linkElement.href
  checkbox.checked = checked
  var listener = checkbox.addEventListener('change', ltdChecked)
}

// Action on (un)check
function ltdChecked(event) {
  console.log('box clicked', event);
  var target = event.target
  var url = target.value
  console.log('url', url)
  // If the checkbox is checked, move to Done
  if (target.checked == true){
    console.log('Done')
    chrome.runtime.sendMessage({
      action: "move-bookmark",
      target: 'done',
      url: url
    });

  } else if (target.checked == false) {
    console.log('ToDo')
    chrome.runtime.sendMessage({
      action: "move-bookmark",
      target: 'todo',
      url: url
    });
  }
}

// Collate links on page
var links = [], l = document.links;
for(var i=0; i<l.length; i++) {
  links.push(l[i]);
}
console.log('links[0]', links[0]);

// Collate ToDo and Done Links
(async () => {
  const bookmarks = await chrome.runtime.sendMessage({action: "get-bookmarks"});
  // do something with response here, not outside the function
  console.log('received bookmarks', bookmarks);

  var toDoBookmarks = bookmarks.todo.map(bookmark =>{
    return bookmark.url.split('?')[0];
  })
  var doneBookmarks = bookmarks.done.map(bookmark =>{
    return bookmark.url.split('?')[0];
  })
  console.log('todo bookmarks', toDoBookmarks);



  for (link of links) {
    if ( toDoBookmarks.includes(link.href.split('?')[0]) ) {
      console.log('todo link found', link)
      addCheckbox(link)
    }
    if ( doneBookmarks.includes(link.href.split('?')[0]) ) {
      console.log('done link found', link)
      addCheckbox(link, 'checked')
    }

  }


})();

// Function to intercept links clicked when the "a" key is held down
function interceptLinks() {
    var links = document.querySelectorAll('a');

    function handleKeyDown(event) {
        // Check if the pressed key is "a"
        if (event.key === 'a') {
            // Add event listener to all anchor tags
            links.forEach(function(link) {
                // Intercept the click event
                link.addEventListener('click', handleClick);
            });
        }
    }

    function handleKeyUp(event) {
        // Check if the released key is "a"
        if (event.key === 'a') {
            // Remove event listener from all anchor tags
            links.forEach(function(link) {
                link.removeEventListener('click', handleClick);
            });
        }
    }

    function handleClick(e) {
        // Prevent the default behavior of clicking the link
        e.preventDefault();
        // Perform your custom action here, for example, logging the link URL
        console.log('Link clicked while holding "a" key. URL:', e);
        // You can also redirect to the link URL if needed
        // window.location.href = e.target.href;
        var linkUrl = e.target.href;
        var pageUrl = window.location.href;
        var selectionText = e.target.innerText

        var linkElement = e.srcElement
        // addCheckbox(linkElement)
        chrome.runtime.sendMessage({ 
          action: "add-todo",
          linkUrl: linkUrl,
          pageUrl: pageUrl,
          selectionText: selectionText
        });


        return

        var linkElements = document.querySelectorAll('a[href="' + linkUrl + '"]')
        console.log('linkElements', linkElements)
        console.log('linkElements.length', linkElements.length);
        if (linkElements.length == 0) {
          var fullUrl = new URL(linkUrl)
          linkElements = document.querySelectorAll('a[href="' + fullUrl.pathname + '"]')
          console.log('linkElements', linkElements);
        }
        if (linkElements.length > 0) {
          for( var linkElement of linkElements){
            console.log('add checkbox')
            addCheckbox(linkElement)
          }
        }
    }

    // Add event listeners to the document for keydown and keyup events
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Call the function to enable link interception
interceptLinks();

