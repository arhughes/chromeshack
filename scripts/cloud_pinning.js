// Generated by CoffeeScript 1.3.3
(function() {
  var PinList, Pinning,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    _this = this;

  Array.prototype.remove = function(e) {
    var t, _ref;
    if ((t = this.indexOf(e)) > -1) {
      return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
    }
  };

  PinList = (function() {

    function PinList() {
      this._getUsername = __bind(this._getUsername, this);

      this.isIdPinned = __bind(this.isIdPinned, this);

      this.removePinnedPost = __bind(this.removePinnedPost, this);

      this.addPinnedPost = __bind(this.addPinnedPost, this);

      this.initializePinList = __bind(this.initializePinList, this);

    }

    PinList.prototype.initializePinList = function(success) {
      var username,
        _this = this;
      username = this._getUsername();
      if (username.length === 0) {
        return;
      }
      getUrl("https://shacknotify.bit-shift.com:12244/users/" + username + "/settings", function(res) {
        if (res.status === 200) {
          console.log("Got settings data: " + res.responseText);
          _this.pinnedList = JSON.parse(res.responseText)['watched'];
          return success();
        }
      });
    };

    PinList.prototype.addPinnedPost = function(id, success) {
      var username,
        _this = this;
      username = this._getUsername();
      if (username.length === 0) {
        return;
      }
      if (!this.pinnedList.contains(id)) {
        getUrl("https://shacknotify.bit-shift.com:12244/users/" + username + "/settings", function(res) {
          var settingsData;
          if (res.status === 200) {
            settingsData = JSON.parse(res.responseText);
            _this.pinnedList.push(parseInt(id));
            settingsData['watched'] = _this.pinnedList;
            return postUrl("https://shacknotify.bit-shift.com:12244/users/" + username + "/settings", JSON.stringify(settingsData), function(res) {
              if (res.status === 200) {
                if (success) {
                  return success();
                }
              }
            });
          }
        });
      }
    };

    PinList.prototype.removePinnedPost = function(id, success) {
      var username,
        _this = this;
      username = this._getUsername();
      if (username.length === 0) {
        return;
      }
      if (this.pinnedList.contains(id)) {
        getUrl("https://shacknotify.bit-shift.com:12244/users/" + username + "/settings", function(res) {
          var settingsData;
          if (res.status === 200) {
            settingsData = JSON.parse(res.responseText);
            _this.pinnedList.remove(parseInt(id));
            settingsData['watched'] = _this.pinnedList;
            return postUrl("https://shacknotify.bit-shift.com:12244/users/" + username + "/settings", JSON.stringify(settingsData), function(res) {
              if (res.status === 200) {
                if (success) {
                  return success();
                }
              }
            });
          }
        });
      }
    };

    PinList.prototype.isIdPinned = function(id) {
      if (!this.pinnedList) {
        return false;
      }
      return this.pinnedList.contains(id);
    };

    PinList.prototype._getUsername = function() {
      var masthead, username;
      if (!this.username) {
        masthead = document.getElementById("user");
        username = getDescendentByTagAndClassName(masthead, "li", "user");
        this.username = stripHtml(username.innerHTML);
      }
      if (!this.username) {
        return '';
      }
      return this.username;
    };

    return PinList;

  })();

  Pinning = (function() {

    function Pinning() {
      this._createElement = __bind(this._createElement, this);

      this._buttonClicked = __bind(this._buttonClicked, this);

      this._listLoaded = __bind(this._listLoaded, this);

      this.addPinLinks = __bind(this.addPinLinks, this);

      this.initialize = __bind(this.initialize, this);

    }

    Pinning.finishedLoadingPinList = false;

    Pinning.prototype.initialize = function() {
      this.pinText = "pin";
      this.unpinText = "unpin";
      this.pinList = new PinList();
      return this.pinList.initializePinList(this._listLoaded);
    };

    Pinning.prototype.addPinLinks = function(item, id, isRootPost) {
      var authorElement, newDiv, pinId;
      if (!isRootPost) {
        return;
      }
      pinId = "pin_" + id;
      if (document.getElementById(pinId)) {
        return;
      }
      authorElement = getDescendentByTagAndClassName(item, "span", "author");
      if (!authorElement) {
        return;
      }
      newDiv = this._createElement(pinId, id, this.finishedLoadingPinList);
      authorElement.appendChild(newDiv);
    };

    Pinning.prototype._listLoaded = function() {
      var pinButton, pinnedItem, _i, _len, _ref, _results;
      this.finishedLoadingPinList = true;
      _ref = this.pinList.pinnedList;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pinnedItem = _ref[_i];
        pinButton = document.getElementById("pin_button_" + pinnedItem);
        if (pinButton) {
          _results.push(pinButton.innerHTML = this.unpinText);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Pinning.prototype._buttonClicked = function(elementId, postId) {
      var button,
        _this = this;
      button = document.getElementById(elementId);
      if (button) {
        if (button.innerHTML === this.pinText) {
          return this.pinList.addPinnedPost(postId, function() {
            return button.innerHTML = _this.unpinText;
          });
        } else {
          return this.pinList.removePinnedPost(postId, function() {
            return button.innerHTML = _this.pinText;
          });
        }
      }
    };

    Pinning.prototype._createElement = function(elementId, postId, pinsLoaded) {
      var button, div, span,
        _this = this;
      div = document.createElement("div");
      div.id = elementId;
      div.className = "pin";
      button = document.createElement("a");
      button.href = "#";
      button.id = "pin_button_" + postId;
      button.className = 'pin_button';
      button.innerHTML = pinsLoaded && this.pinList.isIdPinned(postId) ? this.unpinText : this.pinText;
      if (pinsLoaded) {
        console.log("Created button with id " + elementId + " after pins loaded.");
      }
      button.addEventListener("click", function(e) {
        _this._buttonClicked(button.id, postId);
        return e.preventDefault();
      });
      span = document.createElement("span");
      span.appendChild(document.createTextNode("["));
      span.appendChild(button);
      span.appendChild(document.createTextNode("]"));
      div.appendChild(span);
      return div;
    };

    return Pinning;

  })();

  settingsLoadedEvent.addHandler(function() {
    if (getSetting("enabled_scripts").contains("cloud_pinning")) {
      _this.p = new Pinning();
      _this.p.initialize();
      return processPostEvent.addHandler(_this.p.addPinLinks);
    }
  });

}).call(this);
