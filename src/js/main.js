import * as firebase from './source/firebase';
import * as blockly from './source/blockly';
import * as helpers from './source/helpers';

const connectTo = (drone) => {
    var os = helpers.getMobileOS();

    console.log(os);

    if(os == 'iOS') {

        window.webkit.messageHandlers.observe.postMessage("connectTo" + drone);

    } else if (os == 'Android') {

    // Chrome App
    } else if (os == 'unknown') {

        if (document.location.href.match(/chrome_app/i)) {
            appWindow.postMessage("hideTelemetryBar", appOrigin);
            setTimeout(function() {
                document.location.href = "index.html";
            }, 1000);
        } else {

            console.log('redirect to chrome_app');

            document.location.href = "chrome_app.html";
        }
    }
}

const bind = () => {
    var showCode = false;

    // Let's detect iphone and make the category blocks shorter
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // Let's reduce the padding to 5px for the category blocks
    // Not the prettiest way but we'll go with it for now
    if(userAgent.match( /iPhone/i ) || (userAgent.match( /Android/i ) && userAgent.match( /Mobile\sSafari/i))) {
      $("div#\\:1").css("cssText", "padding: 3px !important");
      $("div#\\:2").css("cssText", "padding: 3px !important");
      $("div#\\:3").css("cssText", "padding: 3px !important");
      $("div#\\:4").css("cssText", "padding: 3px !important");
      $("div#\\:5").css("cssText", "padding: 3px !important");
      $("div#\\:6").css("cssText", "padding: 3px !important");
      $("div#\\:7").css("cssText", "padding: 3px !important");
      $("div#\\:8").css("cssText", "padding: 3px !important");
    }

    $("#codeView").addClass("hidden");

    $('.button-collapse').sideNav({
        edge: 'right',
        closeOnClick: true
    });

    $("#newMission").click(() => {
        localStorage.removeItem('mission');
        $("#missionTitle").text('Untitled Mission');
        Blockly.getMainWorkspace().clear();
    });

    $("#previewMission").click(() => {
        let code = 'var mission="";'
        code += Blockly.JavaScript.workspaceToCode(blockly.workspace);
        code = eval(code);

        var os = helpers.getMobileOS();

        if(os == 'iOS') {

            window.webkit.messageHandlers.observe.postMessage(code);

        } else if (os == 'Android') {

            Android.confirmMission(code);

        } else if (aircraft == "DJI") {

            $("#mapPreviewModal").html("<iframe src='map_preview.html?code=" + escape(code) + "' width='100%' height='100%'></iframe>");
            $("#mapPreviewModal").openModal();

        // Chrome App case
        }  else {

            // Appwindow is so we can post to the chrome app
            appWindow.postMessage(code, appOrigin);

        }
    });

    $("#showCode").click(() => {
        showCode = !showCode;

        if(showCode) {
            $("#blocklyArea").removeClass("full");
            $("#blocklyArea").addClass("half");
            $("#codeView").removeClass("hidden");
            $("#codeView").addClass("block");
            $("#codeViewButton a").html("X");
            $("#code").html(PR.prettyPrintOne(Blockly.Python.workspaceToCode(blockly.workspace)));
            $("#showCode").text("Hide Mission Code");
        } else {
            $("#showCode").text("Show Mission Code");
            $("#blocklyArea").removeClass("half");
            $("#blocklyArea").addClass("full");
            $("#codeView").addClass("hidden");
            $("#codeViewButton a").html("{ Code }");
        }

        // Call to redraw the view
        blockly.onresize();
    });

    $("#connectTo").click((e) => {
        const text = $(e.target).text();
        if (text.includes("Tello")) {
          connectTo('Tello');
        } else {
          connectTo('DJI');
        }
    });

    $("#saveMission").click(() => {

        // Clear out the mission title from the dialog
        $("#title").text("");

        // We only prompt on the first save of the mission
        if(!localStorage.getItem('missionId')) {
            // Update the save text in the modal
            var h6 = $("#saveMissionModal").find("h6");
            h6.text("Please enter a mission title below and click SAVE");
            h6.css({"color": "black"});

            $('#saveMissionModal').openModal();
        } else {
            firebase.saveMission(blockly.workspace);
        }
    });

    $("#saveMissionAs").click(() => {
        // Null out the mission id so a new one will be created
        localStorage.removeItem('missionId');

        // We need to figure out what to do if the user hits the cancel button
        $('#saveMissionModal').openModal();
      });

    $("#saveModal").click(() => {
        firebase.saveMission(blockly.workspace);
    });

    $("#logout").click(function() {
        $(".button-collapse").sideNav("hide");
        $("#login").html('<span class="waves-effect waves-light btn z-depth-0 light-blue btn-login">Login</span>');
        $("#login").addClass("center-align");
        $("#logout").hide();
        $("#d1").hide();
        $("#d2").hide();
        $("#d3").hide();
        $("#saveMission").hide();
        $("#saveMissionAs").hide();
        //$("#shareMission").hide();
        $("#myMissions").hide();

        // Send the logout message to iOS
        if(helpers.getMobileOS() == "iOS") {
          window.webkit.messageHandlers.observe.postMessage("logout");
        }

        firebase.auth().signOut();
        localStorage.removeItem('missionId');
        localStorage.removeItem('uid');
    });

    $("#login").click(function() {
        if ($("#login").html().includes('btn-login')) {
            // let successUrl = '/'
            let {pathname, href} = location;
            if (pathname === '/chrome_app.html') {
                document.location.href = `signin.html?successUrl=${encodeURIComponent(href)}`;
            } else {
                firebase.login();
            }
            // window.open('/signin-widget.html', "Sign In", "width=985,height=735");
        }
    });

    $("#cancel_login").click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        let {pathname, search} = location;
        let query = parseQueryInfo(search);
        document.location.href = decodeURIComponent(query.successUrl || '/');
    });

    $("#setUnits").click((e) => {
        const units = $(e.currentTarget).data('units');

        console.log(units);

        if (units == 'metric') {
            localStorage.setItem('units', 'metric');

            if (document.location.href.match(/chrome_app/i)) {
                document.location.href = "chrome_app_metric.html";
            } else {
                document.location.href = "tello_metric.html";
            }
        } else if (units == 'standard') {
            localStorage.setItem('units', 'standard');

            if (document.location.href.match(/chrome_app/i)) {
                document.location.href = "chrome_app.html";
            } else {
                document.location.href = "tello.html";
            }
        }
    })
}


function setupSigninUI(successUrl = '') {
  var uiConfig = {
    // Url to redirect to after a successful sign-in.
    signInSuccessUrl: successUrl,
    callbacks: {
      signInSuccess: function(user, credential, redirectUrl) {
        if (window.opener) {
          // The widget has been opened in a popup, so close the window
          // and return false to not redirect the opener.
          window.close();
          return false;
        } else {
          // The widget has been used in redirect mode, so we redirect to the signInSuccessUrl.
          return true;
        }
      }
    },
    'accountChooserEnabled': false,
    signInOptions: [
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // Required to enable this provider in One-Tap Sign-up.
        authMethod: "https://accounts.google.com"
      },
      {
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        signInMethod: 'password'
      }
    ],
    // Terms of service url.
    tosUrl: "https://www.google.com",
    credentialHelper: firebaseui.auth.CredentialHelper.NONE // firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM
  };

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  // The start method will wait until the DOM is loaded to include the FirebaseUI sign-in widget
  // within the element corresponding to the selector specified.
  ui.start("#firebaseui-auth-container", uiConfig);
}

function parseQueryInfo(searchInfo) {
    var query = searchInfo.substring(1);
    var vars = query.split('&');
    const obj = {};
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        obj[pair[0]] = pair[1];
    }
    return obj;
}

// Run on document ready
$(document).ready(() => {
    let {pathname, search} = location;
    let query = parseQueryInfo(search);
    // let query = {}, searchSplit = search.split('?')[1];

    // if(searchSplit){
    //     const queryData = searchSplit.split('&');

    // }

    if(pathname === '/chrome_app.html' || pathname === '/' || pathname === '/tello.html'){
        if(aircraft === 'DJI'){
            if(pathname !== '/'){
                location.href = '/' + search;
            }
        }else{
            if(helpers.getMobileOS() !== 'unknown'){
                if(pathname !== '/tello.html'){
                    location.href = '/tello.html' + search;
                }
            }else{
                if(pathname !== '/chrome_app.html'){
                    location.href = '/chrome_app.html' + search;
                }
            }
        }
    }


    if(window.Blockly){
        // Init blockly
        blockly.init();

        if(localStorage.getItem('backup')){
            console.log('Loading canvas from backup.');

            setTimeout(() => {
                Blockly.getMainWorkspace().clear();
                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(localStorage.getItem('backup')), blockly.workspace);
            }, 1000);
        }
    }

    // Init firebase
    firebase.init(() => {
        if(window.Blockly){
            firebase.onAuthStateChanged((user) => {
                console.log('user', user);
                if(query && query.share === '1'){
                    return;
                }

                if(localStorage.getItem('missionId') && !localStorage.getItem('backup')){
                    firebase.getMission(localStorage.getItem('missionId')).then((v) => {
                        console.log('entering another mission', v);
                        if(v){
                            $("#missionTitle").text(v.title);
                            console.log(v);

                            setTimeout(() => {
                                Blockly.getMainWorkspace().clear();
                                Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(v.missionXML), blockly.workspace);
                            }, 1000);
                        }
                    })
                }
            })
        }
    });

    // Init all bindings

    if (pathname === "/signin.html") {
      setupSigninUI(decodeURIComponent(query.successUrl || '/'));
      bind();
    } else {
      bind();
    }
})

