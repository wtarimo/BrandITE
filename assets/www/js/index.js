
var BrandITE = function() {


  return {
    init: function() {
      $("#adminButton").hide();
	  	if (Parse.User.current()) {
        Parse.User.current().fetch();
        $('#accessButton .ui-btn-text').text(Parse.User.current().get('email'));
        $('#accessButton').buttonMarkup({ icon: "delete" });
        $('#accessButton').css('color','red');
        if (Parse.User.current().get('userType')=="Admin") { $("#adminButton").show(); }
	  	} else {
        $('#accessButton .ui-btn-text').text('Sign In');
        $('#accessButton').buttonMarkup({ icon: "edit" });
        BrandITE.alert("Login to unleash your BrandITE Powers!");
        $('#accessButton').css('color','chartreuse ');
	    }
	  },

    showPageLoading: function() {
      $.mobile.loading("show", {
        text: "Loading ...",
        textVisible: "true",
        theme: "b",
        textonly: "true",
        html: "<span style='text-align: center;' class='ui-bar ui-shadow ui-overlay-d ui-corner-all'>"+
        "<div style='position: relative; left: 0; top: 0;'>"+
        "<img src='img/loading2.gif' style='position: relative; top: 0; left: 0;'/>"+
        "</div><h2>BrandITE Loading ...</h2></span>"
      });
    },

    hidePageLoading: function() { $.mobile.loading("hide"); },

    alert: function(msg){
      $("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h3>"+msg+"</h3></div>")
      .css({ display: "block", 
        opacity: 0.90, 
        position: "fixed",
        padding: "7px",
        "text-align": "center",
        width: "270px",
        left: ($(window).width() - 284)/2,
        top: $(window).height()/2 })
      .appendTo( $.mobile.pageContainer ).delay( 2500 )
      .fadeOut( 500, function(){
        $(this).remove();
      });
    },

    refreshPending: function() {
      BrandITE.showPageLoading()
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      query.equalTo("pending", true);
      query.find({
        success: function(topics) {
          $('#pendingPool').empty();
          $('#pendingPool').append("<li id='divider' data-role='list-divider'>Suggested Topics: " + 
           topics.length +"</li>");
          $("#pendingCount1").html(topics.length);
          localStorage['pendingCount']=topics.length;
          
          for (var i = 0; i < topics.length; i++) {
            topicData = [];
            var topic = topics[i];
            if (Parse.User.current()) {
              $("#createTopicOptions").show();
              if (Parse.User.current().get('userType')=="Admin") { var temp = $("#apendingTopic"); }
              else if (Parse.User.current().getUsername()==topic.get('promoter')) { var temp = $("#pendingTopicO"); }
              else { var temp = $("#pendingTopic"); }
            }
            else {
              $("#createTopicOptions").hide();
              var temp = $("#pendingTopic");
            }

            topicData.push({
              id: topic.id,
              title: topic.get('title'),
              date: topic.createdAt.toLocaleString(),
              info: topic.get('info'),
              promoter: topic.get('promoter'),
              id1: topic.id,
            });

            temp.template("topicTemplate");
            $.tmpl("topicTemplate",topicData).appendTo("#pendingPool");
          }
          
          $('#pendingPool').listview('refresh');
        },
        error: function(error) {
          BrandITE.hidePageLoading();
          BrandITE.alert("Error: " + error.code + " " + error.message);
        }
      });
      BrandITE.hidePageLoading();
    },

    refreshCompleted: function() {
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      query.equalTo("discussed", true);
      query.descending('dueDate');

      topicData = [];
      BrandITE.showPageLoading();
      query.find({
        success: function(topics) {
          $('#completedPool').empty();
          $('#completedPool').append("<li id='divider' data-role='list-divider'>Discussed Topics: " + 
           topics.length +"</li>");
          $("#completedCount2").html(topics.length);
          localStorage['completedCount']=topics.length;
          if (Parse.User.current() && Parse.User.current().get('userType')=="Admin") {
            var temp = $("#completedTopicA");
          }
          else { var temp = $("#completedTopic"); }
          for (var i = 0; i < topics.length; i++) { 
            var topic = topics[i];

            topicData.push({
              id: topic.id,
              votes: topic.get('ups').length - topic.get('downs').length,
              title: topic.get('title'),
              date: topic.get('dueDate'),
              info: topic.get('info'),
              location: topic.get('location'),
              id1: topic.id,
            });
          }
          temp.template("topicTemplate");
          $.tmpl("topicTemplate",topicData).appendTo("#completedPool");
          $('#completedPool').listview('refresh');
        },
        error: function(error) {
          BrandITE.hidePageLoading();
          BrandITE.alert("Error: " + error.code + " " + error.message);
        }
      });
      BrandITE.hidePageLoading();
    },


    showVoting: function() {
      if (!Parse.User.current() || Parse.User.current().get('userType')!="Admin") {
        BrandITE.alert("You don't have admin access to this content!");
        $.mobile.changePage('#ballotPage', {
          transition: 'flip',
          reverse: true
        });
      }
      else {
        BrandITE.showPageLoading();
        var User = Parse.Object.extend("User");
        var query = new Parse.Query(User);
        query.notEqualTo("userType", "Admin");
        query.select("email");
        query.find().then(function(users) {
          var Topic = Parse.Object.extend("Topic");
          var query = new Parse.Query(Topic);
          query.select("ups","downs");
          var data = [];
          query.find().then(function(topics) {
            for (var i = 0; i < users.length; i++) {
              var counts = [0, 0];
              var email = users[i].get('email');
              for (var t = 0; t < topics.length; t++) {
                var topic = topics[t];
                if (topic.get('ups').indexOf(email)>=0) { counts[0]+=1; }
                if (topic.get('downs').indexOf(email)>=0) { counts[1]+=1; }
              }
              data.push({email: email,ups: counts[0],downs: counts[1],});
            }
            $('#contentList').empty();
            $('#contentList').append("<li id='divider' data-role='list-divider'>Registered Users: " + 
             users.length +"</li>");
            $("#userVoting").template("votingTemplate");
            $.tmpl("votingTemplate",data).appendTo("#contentList");
            $('#contentList').listview('refresh');
            BrandITE.hidePageLoading();
          });
        });
      }
    },


    refreshBallot: function() {
      BrandITE.showPageLoading();
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      query.equalTo("scheduled", true);
      query.ascending('dueDate');
      
      query.find({
        success: function(topics) {
          $('#scheduledPool').empty();
          $('#scheduledPool').append("<li id='divider' data-role='list-divider'>Scheduled Topics: " + 
           topics.length +"</li>");
          if (Parse.User.current() && Parse.User.current().get('userType')=="Admin") {
            var temp = $("#ascheduledTopic"); }
          else { var temp = $("#scheduledTopic"); }
          topicData = [];
          for (var i = 0; i < topics.length; i++) { 
            var topic = topics[i];
            topicData.push({
              id: topic.id,
              votes: topic.get('ups').length - topic.get('downs').length,
              title: topic.get('title'),
              date: topic.get('dueDate'),
              info: topic.get('info'),
              location: topic.get('location'),
              id1: topic.id,
            });
          }
          temp.template("topicTemplate");
          $.tmpl("topicTemplate",topicData).appendTo("#scheduledPool");
          $('#scheduledPool').listview('refresh');
          
        },
        error: function(error) {
          BrandITE.hidePageLoading();
          BrandITE.alert("Error: " + error.code + " " + error.message);
        }
      });
      BrandITE.hidePageLoading();

      
      BrandITE.showPageLoading();
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      query.equalTo("approved", true);
      query.descending('voteCount');
      query.find({
        success: function(topics) {
          $('#ballotPool').empty();
          $('#ballotPool').append("<li id='divider' data-role='list-divider'>Approved Topics: " + 
           topics.length +"</li>");
          $("#ballotCount").html(topics.length);
          localStorage['ballotCount']=topics.length;
          topicData = [];
          if (Parse.User.current() && Parse.User.current().get('userType')=="User") {
            var temp = $("#approvedTopicU");
          }
          else if (Parse.User.current() && Parse.User.current().get('userType')=="Admin") {
            var temp = $("#approvedTopicA");
          }
          else { var temp = $("#approvedTopic"); }
          for (var i = 0; i < topics.length; i++) { 
            var topic = topics[i];
            topicData.push({
              id: topic.id,
              votes: topic.get('ups').length - topic.get('downs').length,
              title2: topic.get('title'),
              date: topic.createdAt.toLocaleString(),
              info: topic.get('info'),
              promoter: topic.get('promoter'),
              id1: topic.id,
            });
          }
          temp.template("topicTemplate");
          $.tmpl("topicTemplate",topicData).appendTo("#ballotPool");
          $('#ballotPool').listview('refresh');
        },
        error: function(error) {
          BrandITE.hidePageLoading();
          BrandITE.alert("Error: " + error.code + " " + error.message);
        }
      });
      BrandITE.hidePageLoading();
    },
  };
}();


$(document).on('pageinit','#ballotPage', function() {
  BrandITE.init();
});

$(document).on('click','#signUpButton', function(event, data) {
	event.stopImmediatePropagation();
  if ($('#password1').val() == "") {
  	BrandITE.alert("Please enter a password under Sign Up"); }
  else if ($('#email1').val() == "") {
  	BrandITE.alert("Please enter an email under Sign Up"); }
  else {
    BrandITE.showPageLoading()
  	var user = new Parse.User();
  	user.set("username", $('#email1').val());
  	user.set("password", $('#password1').val());
  	user.set("email", $('#email1').val());
  	user.set("userType", "User");
  	user.signUp(null, {
	  success: function(user) {
      BrandITE.hidePageLoading();
      $("#popupLogin").popup("close");
      BrandITE.init();
      BrandITE.refreshBallot();
	  },
	  error: function(user, error) {
      BrandITE.hidePageLoading();
	    BrandITE.alert("Error " + error.code + " " + error.message);
	  }
	});
}
  event.preventDefault();
});

$(document).on('click','#submitMessage', function(event, data) {
  event.stopImmediatePropagation();
  if ($('#subject').val() == "") {
    BrandITE.alert("Please enter a subject"); }
  else if ($('#message').val() == "") {
    BrandITE.alert("Please enter a message"); }
  else {
    var link = "mailto:wtarimo@brandeis.edu"
             + "?subject=" + escape($('#subject').val())
             + "&body=" + escape($('#message').val());
    window.location.href = link;
  }
  event.preventDefault();
});

$(document).on('click','#resetButton', function(event, data) {
  event.stopImmediatePropagation();
  if ($('#rEmail').val() == "") {
    BrandITE.alert("Please enter a valid email address!"); }
  else {
    BrandITE.showPageLoading()
    Parse.User.requestPasswordReset($('#rEmail').val(), {
      success: function() {
        BrandITE.init();
        localStorage['accountType'] = "";
        BrandITE.hidePageLoading();
        $("#popupReset").popup("close");
        BrandITE.alert("Success: Resetting link and instructions have been sent to your email!");
      },
      error: function(error) {
        BrandITE.hidePageLoading();
        BrandITE.alert("Error " + error.code + " " + error.message);
      }
    });
  }
  event.preventDefault();
});


$(document).on('click','#createTopicButton', function(event, data) {
  event.stopImmediatePropagation();
  var Topic = Parse.Object.extend("Topic");
  var topic = new Topic();

  BrandITE.showPageLoading();
  topic.set({
    title: $('#topicTitle').val(),
    info: $('#topicInfo').val(),
    promoter: Parse.User.current().get('email'),
    ups:[],
    downs:[],
    voteCount: 0,
    pending: true,
    scheduled: false,
    location: "",
    approved: false,
    discussed: false,
    readings: $('#topicLinks').val(),
    dueDate: "",
  });

  topic.save(null, {
    success: function(topic) {
      BrandITE.hidePageLoading();
      BrandITE.alert("Submitted, subject to Admin's approval");
      BrandITE.refreshPending();
      $("#popupSuggestTopic").popup("close");
    },
    error: function(course, error) {
      BrandITE.hidePageLoading();
      BrandITE.alert('Failed to create new lecture. Error '+error.code +": "+ error.message);
    }
  });
  event.preventDefault();
});


$(document).on('click','#accessButton', function(event, data) {
	event.stopImmediatePropagation();
  if (Parse.User.current()) {
    BrandITE.showPageLoading();
    Parse.User.logOut();
    BrandITE.init();
    BrandITE.refreshBallot();
    BrandITE.hidePageLoading();
  }
  else {
    $("#popupLogin").popup("open");
  }
  event.preventDefault();
});

$(document).on('click','#approveButton', function(event, data) {
  event.stopImmediatePropagation();
  var Topic = Parse.Object.extend("Topic");
  var query = new Parse.Query(Topic);
  BrandITE.showPageLoading();
  query.get($(this).attr('id1'), {
    success: function(topic) {
      topic.set('pending',false);
      topic.set('approved',true);
      topic.save(null, {
        success: function(topic) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Topic Approved');
          $("#ballotCount1").html(parseInt(localStorage['ballotCount'])+1);
          localStorage['ballotCount'] = parseInt(localStorage['ballotCount'])+1;
          BrandITE.refreshPending();
        },
        error: function(topic, error) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Post approval failed. Error: ' + error.message);
        }
      });
    },
    error: function(topic, error) {
      BrandITE.hidePageLoading();
      BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
    }
  });
  event.preventDefault();
});

$(document).on('click','#deleteButton', function(event, data) {
  event.stopImmediatePropagation();
  var Topic = Parse.Object.extend("Topic");
  var query = new Parse.Query(Topic);
  BrandITE.showPageLoading();
  query.get($(this).attr('id1'), {
    success: function(topic) {
      topic.destroy({
        success: function(topic) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Topic Deleted');
          $("#completedCount2").html(parseInt(localStorage['completedCount'])-1);
          localStorage['completedCount'] = parseInt(localStorage['completedCount'])-1;
          BrandITE.refreshCompleted();
        },
        error: function(topic, error) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Delete failed. Error: ' + error.message);
        }
      });
    },
    error: function(topic, error) {
      BrandITE.hidePageLoading();
      BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
    }
  });
  event.preventDefault();
});

$(document).on('click','#openReadings', function(event, data) {
  event.stopImmediatePropagation();
  event.preventDefault();
  var Topic = Parse.Object.extend("Topic");
  var query = new Parse.Query(Topic);
  BrandITE.showPageLoading();
  query.get($(this).attr('id1'), {
    success: function(topic) {
      var readings = topic.get('readings');
      if (readings) {
        for (link in readings.split(";")) {
          window.open(readings[link]);
        }
        BrandITE.alert("Readings opened on other tabs/windows");
      }
      
      else {
        BrandITE.alert("No readings assigned");
      }
      BrandITE.hidePageLoading();
    },
    error: function(topic, error) {
      BrandITE.hidePageLoading();
      BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
    }
  });
  BrandITE.hidePageLoading();
});


$(document).on('click','#editButton', function(event, data) {
  event.stopImmediatePropagation();
  event.preventDefault();
  var Topic = Parse.Object.extend("Topic");
  var query = new Parse.Query(Topic);
  BrandITE.showPageLoading();
  query.get($(this).attr('id1'), {
    success: function(topic) {
      BrandITE.hidePageLoading();
      $('#popupSuggestTopic').popup("open");
      $("#topicTitle").val(topic.get("title"));
      $("#topicInfo").val(topic.get("info"));
      $("#topicLinks").val(topic.get("readings"));
      $('#createTopicButton').bind('click', function(event1, data) {
        event1.stopImmediatePropagation();
        event1.preventDefault();
        BrandITE.showPageLoading();
        topic.set('title',$("#topicTitle").val());
        topic.set('info',$("#topicInfo").val());
        topic.set('readings',$("#topicLinks").val());
        topic.save(null, {
          success: function(topic) {
            $('#popupSuggestTopic').popup("close");
            BrandITE.alert('Topic Edited');
            BrandITE.refreshPending();
          },
          error: function(topic, error) {
            BrandITE.hidePageLoading();
            BrandITE.alert('Edit failed. Error: ' + error.message);
          }
        });
      });
      },
    error: function(topic, error) {
      BrandITE.hidePageLoading();
      BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
    }
  });
  BrandITE.hidePageLoading();
});


$(document).on('click','#loginButton', function(event, data) {
    event.stopImmediatePropagation();
    if ($('#email').val() == "") {
      BrandITE.alert("Please enter a valid e-mail under Sign In"); }
    else if ($('#password').val() == "") {
      BrandITE.alert("Password missing under Sign In"); }
    else {
      BrandITE.showPageLoading()
      Parse.User.logIn($('#email').val(), $('#password').val(), {
      success: function(user) {
        $('#accessButton .ui-btn-text').text(Parse.User.current().get('email'));
        $('#accessButton').buttonMarkup({ icon: "delete" });
        BrandITE.hidePageLoading();
        $("#popupLogin").popup("close");
        BrandITE.init();
        BrandITE.refreshBallot();
      },
      error: function(user, error) {
        BrandITE.hidePageLoading();
        BrandITE.alert("Error " + error.code + " " + error.message);
      }
    });
  }
    event.preventDefault();
  });file:///C:/Users/William/Dropbox/PhoneGap/Projects/BrandITE/index.html#


$(document).on('pagebeforeshow','#pendingPage', function() {
  BrandITE.refreshPending();
  $("#ballotCount1").html(localStorage['ballotCount']);
  $("#completedCount1").html(localStorage['completedCount']);
});

$(document).on('pagebeforeshow','#adminPage', function() {
  if (!Parse.User.current() || Parse.User.current().get('userType')!="Admin") {
    BrandITE.alert("You don't have admin access to the page!");
    $.mobile.changePage('#ballotPage', {
      transition: 'flip',
      reverse: true
    });
  }
});

$(document).on('pagebeforeshow','#completedPage', function() {
  BrandITE.refreshCompleted();
  $("#ballotCount2").html(localStorage['ballotCount']);
  $("#pendingCount2").html(localStorage['pendingCount']);
});

$(document).on('pagebeforeshow','#ballotPage', function() {
  BrandITE.refreshBallot();
  $("#pendingCount").html(localStorage['pendingCount']);
  $("#completedCount").html(localStorage['completedCount']);
});

$(document).on('pageshow','#ballotPage', function() {
  $('#ballotPool').on('click', 'a', function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    var id = $(this).attr('id') ||  $(this).attr('id1');
    if ($(this).attr('data-rel')!="popup" && Parse.User.current()) {
      if (Parse.User.current().get('userType')=="Admin") {
        var Topic = Parse.Object.extend("Topic");
        var query = new Parse.Query(Topic);
        BrandITE.showPageLoading();
        query.get(id, {
          success: function(topic) {
            BrandITE.hidePageLoading();
            $('#schedulePostPopup').popup("open");
            $('#eventInfo').val(topic.get('info'));
            $('#topicLinks').val(topic.get('readings'));
            $('#scheduleButton').bind('click', function(event1, data) {
              event1.stopImmediatePropagation();
              event1.preventDefault();
              topic.set('scheduled',true);
              topic.set('approved',false);
              topic.set('dueDate',$('#dueDate').val()+" at "+$('#startTime').val());
              topic.set('location', $('#eventLocation').val());
              topic.set('info',$('#eventInfo').val());
              topic.set('readings',$('#topicLinks').val());
              topic.save(null, {
                success: function(topic) {
                  BrandITE.hidePageLoading();
                  $('#schedulePostPopup').popup("close");
                  BrandITE.alert('Post Scheduled');
                  BrandITE.refreshBallot();
                },
                error: function(topic, error) {
                  BrandITE.hidePageLoading();
                  BrandITE.alert('Scheduling Failed. Error: ' + error.message);
                }
              });
            }); 
          },
          error: function(topic, error) {
            BrandITE.hidePageLoading();
            BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
          }
        });
      }

      else {
        var Topic = Parse.Object.extend("Topic");
        var query = new Parse.Query(Topic);
        BrandITE.showPageLoading();
        query.get(id, {
          success: function(topic) {
            if (topic.get('ups').indexOf(Parse.User.current().get('email')) != -1) {
              BrandITE.hidePageLoading();
              BrandITE.alert('You have already voted up this post');
            }
            else {
              topic.addUnique('ups',Parse.User.current().get('email'));
              topic.remove('downs',Parse.User.current().get('email'));
              topic.set('voteCount',topic.get('ups').length - topic.get('downs').length);
              topic.save(null, {
                success: function(topic) {
                  BrandITE.hidePageLoading();
                  BrandITE.alert('Topic Voted Up');
                  BrandITE.refreshBallot();
                },
                error: function(topic, error) {
                  BrandITE.hidePageLoading();
                  BrandITE.alert('Vote failed. Error: ' + error.message);
                }
              });
            }
          },
          error: function(topic, error) {
            BrandITE.hidePageLoading();
            BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
          }
        });
      }
    }

    else if ($(this).attr('data-rel')=="popup" && Parse.User.current().get('userType')=="Admin") {
      
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      BrandITE.showPageLoading();
      query.get(id, {
        success: function(topic) {
          BrandITE.hidePageLoading();
          $('#popupEditTopic').popup("open");
          $("#topicTitle1").val(topic.get("title"));
          $("#topicInfo1").val(topic.get("info"));
          $('#topicLinks1').val(topic.get('readings'));
          $('#editTopicButton').bind('click', function(event1, data) {
            event1.stopImmediatePropagation();
            event1.preventDefault();
            BrandITE.showPageLoading();
            topic.set('title',$("#topicTitle1").val());
            topic.set('info',$("#topicInfo1").val());
            topic.set('readings',$('#topicLinks1').val());
            topic.save(null, {
              success: function(topic) {
                $('#popupEditTopic').popup("close");
                BrandITE.alert('Topic Edited');
                BrandITE.refreshBallot();
              },
              error: function(topic, error) {
                BrandITE.hidePageLoading();
                BrandITE.alert('Edit failed. Error: ' + error.message);
              }
            });
          });
          },
        error: function(topic, error) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
        }
      });
      BrandITE.hidePageLoading();
    }

    else if (Parse.User.current()){
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      BrandITE.showPageLoading();
      query.get(id, {
        success: function(topic) {
          var votes = topic.get('votes');
          if (topic.get('downs').indexOf(Parse.User.current().get('email')) != -1) {
            BrandITE.hidePageLoading();
            BrandITE.alert('You have already voted down this post');
          }
          else {
            topic.addUnique('downs',Parse.User.current().get('email'));
            topic.remove('ups',Parse.User.current().get('email'));
            topic.set('voteCount',topic.get('ups').length - topic.get('downs').length);
           topic.save(null, {
              success: function(topic) {
                BrandITE.hidePageLoading();
                BrandITE.alert('Topic Voted Down');
                BrandITE.refreshBallot();
              },
              error: function(topic, error) {
                BrandITE.hidePageLoading();
                BrandITE.alert('Vote failed. Error: ' + error.message);
              }
            });
          }
        },
        error: function(topic, error) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
        }
      });
    }
  });


  $('#scheduledPool').on('click', 'a', function (event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    BrandITE.postId = $(this).attr('id1') || $(this).attr('id');
    if (Parse.User.current() && Parse.User.current().get('userType')=="Admin") {
      if ($(this).attr('data-rel')=="popup") {
        var Topic = Parse.Object.extend("Topic");
        var query = new Parse.Query(Topic);
        BrandITE.showPageLoading();
        query.get(BrandITE.postId, {
          success: function(topic) {
            topic.set('scheduled',false);
            topic.set('discussed',true);
            topic.save(null, {
              success: function(topic) {
                BrandITE.hidePageLoading();
                BrandITE.alert('Post Moved to Completed!');
                $("#completedCount").html(parseInt(localStorage['completedCount'])+1);
                localStorage['completedCount'] = parseInt(localStorage['completedCount'])+1;
                BrandITE.refreshBallot();
              },
              error: function(topic, error) {
                BrandITE.hidePageLoading();
                BrandITE.alert('Operation Failed. Error: ' + error.message);
              }
            });
          },
          error: function(topic, error) {
            BrandITE.hidePageLoading();
            BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
          }
        });
      }
      else {
        var Topic = Parse.Object.extend("Topic");
        var query = new Parse.Query(Topic);
        BrandITE.showPageLoading();
        query.get(BrandITE.postId, {
          success: function(topic) {
            BrandITE.hidePageLoading();
            $('#schedulePostPopup').popup("open");
            $('#eventInfo').val(topic.get('info'));
            $('#topicLinks').val(topic.get('readings'));
            $('#scheduleButton').bind('click', function(event1, data) {
              event1.stopImmediatePropagation();
              event1.preventDefault();
              topic.set('dueDate',$('#dueDate').val()+" at "+$('#startTime').val());
              topic.set('location', $('#eventLocation').val());
              topic.set('info',$('#eventInfo').val());
              topic.set('readings',$('#topicLinks').val());
              topic.save(null, {
                success: function(topic) {
                  BrandITE.hidePageLoading();
                  $('#schedulePostPopup').popup("close");
                  BrandITE.alert('Post Scheduled');
                  BrandITE.refreshBallot();
                },
                error: function(topic, error) {
                  BrandITE.hidePageLoading();
                  BrandITE.alert('Scheduling Failed. Error: ' + error.message);
                }
              });
            }); 
          },
          error: function(topic, error) {
            BrandITE.hidePageLoading();
            BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
          }
        });

      }
    }
    else if ($(this).attr('id')=="openReadings") {
      var Topic = Parse.Object.extend("Topic");
      var query = new Parse.Query(Topic);
      BrandITE.showPageLoading();
      query.get($(this).attr('id1'), {
        success: function(topic) {
          var readings = topic.get('readings').split(";");
          if (readings) {
            for (link in readings) {
              window.open(readings[link], '_blank');
            }
            BrandITE.alert("Readings opened on other tabs/windows");
          }
          
          else {
            BrandITE.alert("No readings assigned");
          }
          BrandITE.hidePageLoading();
        },
        error: function(topic, error) {
          BrandITE.hidePageLoading();
          BrandITE.alert('Failed to retrieve post. Error: ' + error.message);
        }
      });
      BrandITE.hidePageLoading();
    }
  });
});