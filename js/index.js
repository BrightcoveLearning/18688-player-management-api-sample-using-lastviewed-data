var BCLS = (function(window, document) {
  var playerMngmtURL = "https://players.api.brightcove.com/v2/accounts/",
    proxyURL =
      "https://solutions.brightcove.com/bcls/bcls-proxy/bcls-proxy-v2.php",
    default_account_id = "57838016001",
    all_player_data = "";
  (account_id_input = document.getElementById("account_id_input")),
    (client_id_input = document.getElementById("client_id_input")),
    (client_secret_input = document.getElementById("client_secret_input")),
    (apiRequest = document.getElementById("apiRequest")),
    (playerTable = document.getElementById("playerTable")),
    (apiMethod = document.getElementById("apiMethod")),
    (apiResponse = document.getElementById("apiResponse")),
    // buttons
    (all_buttons = document.querySelectorAll(".bcls-button")),
    (get_last_viewed = document.getElementById("get_last_viewed")),
    (reset_app = document.getElementById("reset_app"));

  /**
   * event listeners
   */
  get_last_viewed.addEventListener("click", function() {
    createRequest("get_last_viewed");
  });

  reset_app.addEventListener("click", function() {
    reset();
  });

  /**
   * disables all buttons so user can't submit new request until current one finishes
   */
  function disableButtons() {
    var i,
      iMax = all_buttons.length;
    for (i = 0; i < iMax; i++) {
      all_buttons[i].setAttribute("disabled", "disabled");
      all_buttons[i].setAttribute(
        "style",
        "color:#999;cursor:not-allowed;border:1px #999 solid;"
      );
    }
  }

  /**
   * enables a button element
   * @param {htmlElement} button the button
   */
  function enableButton(button) {
    button.removeAttribute("disabled");
    button.removeAttribute("style");
  }

  function reset() {
    disableButtons();
    enableButton(get_last_viewed);
  }

  /**
   * sets up the data for the API request
   * @param {String} id the id of the button that was clicked
   */
  function createRequest(id) {
    var endPoint = "",
      options = {},
      requestBody = {};
    // disable buttons to prevent a new request before current one finishes
    disableButtons();
    options.account_id =
      account_id_input.value.length > 0
        ? account_id_input.value
        : "57838016001";
    if (
      client_id_input.value.length > 0 &&
      client_secret_input.value.length > 0
    ) {
      options.client_id = client_id_input.value;
      options.client_secret = client_secret_input.value;
    }
    options.proxyURL = proxyURL;
    endPoint = options.account_id + "/players";
    options.url = playerMngmtURL + endPoint;
    options.requestType = "GET";
    apiRequest.textContent = options.url;
    apiMethod.textContent = options.requestType;
    makeRequest(options, function(response) {
      var parsedData,
        i,
        iMax,
        option,
        frag = document.createDocumentFragment();
      parsedData = JSON.parse(response);
      apiResponse.textContent = JSON.stringify(parsedData, null, 2);
      apiResponse.textContent = JSON.stringify(parsedData, null, "  ");
      // enable the create experience button
      disableButtons();
      // Using returned data, call function that builds the table
      buildTable(parsedData);
    });
  }

  /**
   * send API request to the proxy
   * @param  {Object} options for the request
   * @param  {String} options.url the full API request URL
   * @param  {String="GET","POST","PATCH","PUT","DELETE"} requestData [options.requestType="GET"] HTTP type for the request
   * @param  {String} options.proxyURL proxyURL to send the request to
   * @param  {String} options.client_id client id for the account (default is in the proxy)
   * @param  {String} options.client_secret client secret for the account (default is in the proxy)
   * @param  {JSON} [options.requestBody] Data to be sent in the request body in the form of a JSON string
   * @param  {Function} [callback] callback function that will process the response
   */
  function makeRequest(options, callback) {
    var httpRequest = new XMLHttpRequest(),
      response,
      proxyURL = options.proxyURL,
      // response handler
      getResponse = function() {
        try {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status >= 200 && httpRequest.status < 300) {
              response = httpRequest.responseText;
              // some API requests return '{null}' for empty responses - breaks JSON.parse
              if (response === "{null}") {
                response = null;
              }
              // return the response
              callback(response);
            } else {
              alert(
                "There was a problem with the request. Request returned " +
                  httpRequest.status
              );
            }
          }
        } catch (e) {
          alert("Caught Exception: " + e);
        }
      };
    /**
     * set up request data
     * the proxy used here takes the following request body:
     * JSON.stringify(options)
     */
    // set response handler
    httpRequest.onreadystatechange = getResponse;
    // open the request
    httpRequest.open("POST", proxyURL);
    // set headers if there is a set header line, remove it
    // open and send request
    httpRequest.send(JSON.stringify(options));
  }

  /**
   * sort an array of objects based on an object property
   * @param {array} targetArray - array to be sorted
   * @param {string|number} objProperty - object property to sort on
   * @return sorted array
   */
  function sortArray(targetArray, objProperty) {
    targetArray.sort(function(a, b) {
      var propA = a[objProperty].length,
        propB = b[objProperty].length;
      // sort ascending; reverse propA and propB to sort descending
      if (propB < propA) {
        return -1;
      } else {
        return 1;
      }
    });
    return targetArray;
  }

  /**
   *builds a table from the players' last_viewed array
   * @param JSON rawPlayerData - all data returned from the Player Mgmt API call /players
   */

  function buildTable(rawPlayerData) {
    // Build skeleton of table
    playerTable.innerHTML =
      '<table id="myTable"><tr><th style="width: 40%">Name</th><th style="width: 20%">Player ID</th><th style="width: 40%">last_viewed Info</th></tr></table>';

    // Extract items array from raw JSON
    var arrayOfPlayers = rawPlayerData.items;
    // Sort so players with views at the top of table
    sortArray(arrayOfPlayers, "last_viewed");
    // Get number of players
    numPlayers = arrayOfPlayers.length;
    // Get table element for later use
    var table = document.getElementById("myTable");
    // Style table
    table.setAttribute("class", "bcls-Data-Table");

    //Loop over all players
    for (var i = 0; i < numPlayers; i++) {
      var lastViewedAra = arrayOfPlayers[i].last_viewed;
      var lastViewedLength = lastViewedAra.length;

      // Insert a row
      var row = table.insertRow(i + 1);

      // Insert new cells (<td> elements):
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);

      // Add some text to the new cells:
      cell1.innerHTML = rawPlayerData.items[i].name;
      cell2.innerHTML = rawPlayerData.items[i].id;
      // If last_viewed array has entries, display them, otherwise display Not viewed
      if (lastViewedLength > 0) {
        //Dynamically build one or more <ul> elements
        var myUL = "<ul>",
          formattedDate;
        // Loop over all elements in single player's last_viewed array
        for (var j = 0; j < lastViewedLength; j++) {
          formattedDate = moment(formattedDate).format("DD MMM YY");
          var myLI =
            "<li> Count: " +
            lastViewedAra[j].count +
            " Date: " +
            formattedDate +
            "</li>";
          myUL += myLI;
        }
        myUL += "</ul>";
        cell3.innerHTML = myUL;
      } else {
        cell3.innerHTML = "Not viewed";
      }
    }
  }

  // set initial state
  reset();
})(window, document);
