(function() {
  if (!navigator.serviceWorker) return;
  var thisScriptURL = document.currentScript.src;
  // some nasty url hacking that should probably be done some other way
 
  //what folder is the manifest in
  function getPathByName() {
    // this is deeply flawed. fails on MobyDick/folder/manifest.json
    var path = RegExp('[?]manifest=' + '([^/]*)')
                 .exec(window.location.search);
    return path
      ? decodeURIComponent(path[1].replace(/\+/g, ' '))
      : null;
  }

  var publicationName = getPathByName();
  var ui = document.getElementById('page-controls');
  var uiEpub = document.getElementById('epub-controls');
  var baseURL = RegExp('(.*?)/page.js')
                 .exec(thisScriptURL)[1];
  var appFolder = 'acme-labs/';
  

  // navigator.serviceWorker.register(new URL('sw.js', thisScriptURL));
  navigator.serviceWorker.register('kroner.js');

  if (navigator.serviceWorker.controller) {
    initPageControls();
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', function onControllerChange() {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      initPageControls();
    });
  }

  function initPageControls() {
    caches.has(publicationName).then(function(isCached) {
      ui.innerHTML =
        '<span><label class="status"><input type="checkbox" class="work-offline">Save</label></span>'
        + '<form method="get" action="' + publicationName
        + '/download-publication"><button type="submit">Zip</button></form>' + '<form method="get" action="' + publicationName
        + '/download-package"><button type="submit">Package</button></form>'  + '<form method="get" action="' + publicationName
        + '/download-EPUB"><button type="submit">EPUB</button></form>';
        

        //      '<span class="download"><a href="' + publicationName + '/download-publication">Download</a></span>';

      var status = ui.querySelector('.status');
      var checkbox = ui.querySelector('.work-offline');
      checkbox.checked = isCached;

      checkbox.addEventListener('change', function(event) {
        if (!this.checked) {
          caches.delete(publicationName);
          status.textContent = "Removed";
        } else {
         status.textContent = "Offlinifying";
          fetch(publicationName + '/manifest.json', { mode: 'no-cors' })
            .then(function(response) {
              return response.json();
            })
            .then(function(dave) {
              newArray = dave.resources.map(function(el) { return el.href});
              return dave.spine.map(function(el) { return el.href}).concat(newArray);
            })
            .then(function(data) {
              data.push('manifest.json');
              publicationURL = publicationName;

              return caches.open(publicationName).then(function(cache) {
                return cache.addAll(data.map(function(url) {
                  return new URL(appFolder + publicationName + '/' + url, baseURL);
                }));
              });
            })
            .then(function() {
              // status.textContent = 'Offlinification complete!';
              alert("Offlinification complete!");
              status.textContent = "Saved";
            })
            .catch(function(err) {
              console.log(err);
              // status.textContent = 'Offlinification failed :(';
              alert("Offlinification failed!");
              status.textContent = "";
            });
        }
      });
    });
  }
}());
