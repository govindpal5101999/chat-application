let myStream;
var currentPeer;
var peerList = [];

var peer = new Peer({
    host: 'localhost',
    port: 9000,
    debug: true,
    // config: {
    //     'iceServers': []
    // }
})

var time = 0;

peer.on('open', (id) => {
    document.getElementById('link').innerHTML = id;
});

peer.on('call', (call) => {
    var accept = confirm('incoming call you want to accept !');
    if (accept) {
        calling.play();
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then((stream) => {

            myStream = stream;
            addOurVideo(stream)
            call.answer(stream)
            call.on('stream', (remoteStream) => {
                if (!peerList.includes(call.peer)) {
                    calling.pause();
                    // document.getElementById('show-peer').innerHTML = "connected";
                    document.getElementById('share-screen').style.display = 'block';
                    document.getElementById('Enable-video').style.display = 'block';
                    document.getElementById('Disable-mute').style.display = 'block';
                    document.getElementById('count-show').style.display = 'block';
                    var stopTimer = setInterval(() => {
                        document.getElementById('count-show').innerHTML = time;
                        time++
                    }, 1000);
                    var show = document.getElementById('end-call');
                    show.style.display = 'block';
                    show.addEventListener('click', () => {
                        clearInterval(stopTimer);
                        time = 0;
                    })
                    addRemoteVideo(remoteStream)
                    currentPeer = call.peerConnection
                    peerList.push(call.peer)
                }

            })

        }).catch((err) => {
            console.log(err + " unable to get media")
        })
        // document.getElementById('end-call').addEventListener('click', () => {
        //     // This isn't working in chrome; works perfectly in firefox.
        //     peer.on('close', function () {
        //         document.getElementById("video-container").remove();
        //         peer.destroy()
        //     })
        // });

    } else {
        console.log('call is denied !');
    }

})

document.getElementById('call-peer').addEventListener('click', (e) => {

    let remotePeerId = document.getElementById('peerID').value;
    document.getElementById('show-peer').innerHTML = "connecting.....";

    callPeer(remotePeerId);

    document.getElementById('peerID').value = "";
    document.getElementById('call-peer').style.display = 'none';
    document.getElementById('peerID').style.display = 'none';
    document.getElementById('link').style.display = 'none';
    document.getElementById('add-link').style.display = 'block';
});

document.getElementById('share-screen').addEventListener('click', (e) => {

    navigator.mediaDevices.getDisplayMedia({
        video: {
            cusrsor: "always"
        },
        audio: {
            echoCancellation: true,
            noisSuppression: true
        }
    }).then((stream) => {
        let videoTrack = stream.getVideoTracks()[0];
        videoTrack.onended = function () {
            stopScreenShare();
        }
        let sender = currentPeer.getSenders().find((s) => {
            return s.track.kind == videoTrack.kind
        })
        sender.replaceTrack(videoTrack)

    }).catch((err) => {
        console.log(" unable to get display ", + err)
    })
});

function callPeer(id) {

    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    }).then((stream) => {
        myStream = stream;
        addOurVideo(stream)
        let call = peer.call(id, stream)
        socket.emit("call-user");
        call.on('stream', (remoteStream) => {
            if (!peerList.includes(call.peer)) {
                document.getElementById('show-peer').style.display = "none";
                document.getElementById('share-screen').style.display = 'block';
                document.getElementById('Enable-video').style.display = 'block';
                document.getElementById('Disable-mute').style.display = 'block';
                document.getElementById('count-show').style.display = 'block';
                var stopTimer = setInterval(() => {
                    document.getElementById('count-show').innerHTML = time;
                    time++
                }, 1000);
                var show = document.getElementById('end-call');
                show.style.display = 'block';
                show.addEventListener('click', () => {
                    clearInterval(stopTimer);
                    time = 0;
                })
                addRemoteVideo(remoteStream)
                currentPeer = call.peerConnection
                peerList.push(call.peer)
            }
            else {
                document.getElementById('show-peer').innerHTML = 'Rejected call';
            }

        })

    }).catch((err) => {
        console.log(err + "unable to get media")
    })
}

function stopScreenShare() {
    let videoTrack = myStream.getVideoTracks()[0];
    var sender = currentPeer.getSenders().find((s) => {
        return s.track.kind == videoTrack.kind
    })
    sender.replaceTrack(videoTrack)
}

function addRemoteVideo(stream) {
    var video = document.createElement('video');
    // video.classList.add('remoteVideo')
    video.srcObject = stream;
    video.play();
    document.getElementById('video-container').append(video)

}

function addOurVideo(stream) {
    var video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    document.getElementById('video-container').append(video)
}

//for Mute/Unmute ---->
let isAudio = true;

//for mute ----->
function mute() {
    isAudio = !isAudio
    myStream.getAudioTracks()[0].enabled = isAudio;
    document.getElementById('Disable-mute').style.display = 'block';
    document.getElementById('Enable-mute').style.display = 'none';
}

//for Unmute ---->
function unMute() {
    isAudio = !isAudio
    myStream.getAudioTracks()[0].enabled = isAudio;
    document.getElementById('Disable-mute').style.display = 'none';
    document.getElementById('Enable-mute').style.display = 'block';
}



//for video-Disable/Enable ----->
let isVideo = true;

//for Disable video ---->
function disable() {
    isVideo = !isVideo
    myStream.getVideoTracks()[0].enabled = isVideo;
    document.getElementById('Enable-video').style.display = 'block';
    document.getElementById('Disable-video').style.display = 'none';
}

//for Enable video ---->
function enable() {
    isVideo = !isVideo
    myStream.getVideoTracks()[0].enabled = isVideo;
    document.getElementById('Enable-video').style.display = 'none';
    document.getElementById('Disable-video').style.display = 'block';
}

/********************************************************************************** Video-Call-End ************************************************************************/


//For Public Chat ---->

const socket = io({ transports: ['websocket'] });

//for audio notifications--->
var incomingMsg = new Audio('/tune/ting.mp3');
var calling = new Audio('/tune/trin-trin.mp3');
var join = new Audio('/tune/user-join-left.mp3');

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": 300,
    "hideDuration": "1000",
    "timeOut": 7000,
    "extendedTimeOut": 7000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

// New-Notifications------->

socket.on('new-public-notification', (resp) => {
    toastr.success(resp, 'Public-Message')
});

socket.on('new-private-notification', (resp) => {
    toastr.success(resp, 'Private-Message')
});

socket.on('new-call-notification', (resp) => {
    toastr.success(resp, 'Someone-Is-Calling')
});

var userlist = [];

//login by pressing keys only ---->

// document.onkeydown = function (e) {
//     if (e.keyCode == 13) {
//         // sendEmail()
//         // validateForm();
//         login();
//     }

// }

function login() {
    let username = document.getElementById('login_name').value
    let password = document.getElementById('login_pass').value
    
    $.ajax({
        type: "POST",
        url: "http://localhost:3000/login",
        data: JSON.stringify({ "username": username, "password": password }),
        success: function (resp) {
            if (resp.status) {
                document.getElementById('main-box').style.display = 'block'
                document.getElementById('login-box').style.display = 'none'
                sessionStorage.setItem("user", JSON.stringify(resp.data));
                document.getElementById('me').innerHTML += `<div id = "my-img" ><img src="/images/upload_images/${resp.data.image}" /></div><span id= "full-name">${resp.data.first_name}  ${resp.data.last_name}</span>`;
                socket.emit('loggedin', resp.data);
                socket.emit('new-user-joined', resp.data.first_name);
            
            } else {
                alert('Invalid Credentials....!')
            }
        },
        dataType: "json",
        contentType: "application/json"
    });

    document.getElementById('login_name').value = "";
    document.getElementById('login_pass').value = "";
    document.getElementById('first_name').value = "";
}

const sendMyMessage = (chatWidowId, fromUser, message) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'))
    let meClass = loggedInUser.user_id == fromUser.user_id ? 'me' : '';

    $('#private-box').find(`#${chatWidowId} .body`).append(`
        <div class="chat-text ${meClass}">
        <div class="userPhoto"><img src="/images/upload_images/${fromUser.image}" />${message}</div>
        </div>
    `);
    scrollPrivateBottom()
}

const sendMessage = (room) => {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'))
    let message = $('#' + room).find('.messageText').val();
    $('#' + room).find('.messageText').val('');
    socket.emit('message', { room: room, message: message, from: loggedInUser });
    sendMyMessage(room, loggedInUser, message)
    document.getElementById('call-peer').style.display = 'none';
    document.getElementById('peerID').style.display = 'none';
    document.getElementById('link').style.display = 'none';
    document.getElementById('add-link').style.display = 'block';
}
const openChatWindow = (room) => {
    if ($(`#${room}`).length === 0) {
        $('#private-box').append(`
        <div class="chat-window" id="${room}">
            <div class="body"><div id="privateScroll" onclick="scrollPrivateBottom()"><img src="/icons/icon1.jpg" alt="failed to load image"></div></div>
            <div class="footer">
                <textarea type="text" placeholder="private chat..." class="messageText"></textarea><button onclick="sendMessage('${room}')">Send</button>
            </div>
        </div>
        `)
        scrollPrivateBoxBottom()
    }
}
const createRoom = (id) => {
    if (!userlist.includes(id)) {
        let loggedInUser = JSON.parse(sessionStorage.getItem('user'));
        let room = Date.now() + Math.random();
        room = room.toString().replace(".", "_");
        socket.emit('create', { room: room, userId: loggedInUser.userId, withUserId: id });
        openChatWindow(room);
        document.getElementById('private-box').style.display = 'block';
        scrollPrivateBoxBottom();
        userlist.push(id)
    }

}

socket.on('updateUserList', function (userList) {
    let loggedInUser = JSON.parse(sessionStorage.getItem('user'));
    $('#user-list').html('<ul></ul>');
    userList.forEach(item => {
        if (loggedInUser.user_id != item.user_id) {
            $('#user-list ul').append(`<li data-id="${item.user_id}" onclick="createRoom('${item.user_id}')"><img src="/images/upload_images/${item.image}" /><span id= "list-first_name">${item.first_name}</span></li>`)
            join.play();
            scrollUserListBottom();
        }
    });

    socket.on('usercount', (msg) => {
        document.getElementById('online-users').innerHTML = `online users` + `(` + msg + `)`;
    })
});

socket.on('invite', function (data) {
    socket.emit("joinRoom", data)
});
socket.on('message', function (msg) {
    //If chat window not opened with this roomId, open it
    if (!$('#private-box').find(`#${msg.room}`).length) {
        openChatWindow(msg.room)
    }
    sendMyMessage(msg.room, msg.from, msg.message)
    incomingMsg.play();
    // socket.emit("send-private-notification", msg.message);
});

// Public chat ---->

const form = document.getElementById('send-container');
const messagebox = document.getElementById('message-box');
const rightbox = document.querySelector("#right-box");

const append = (message, position) => {
    const messageElement = document.createElement('text');
    messageElement.innerText = message;
    messageElement.classList.add('message');
    messageElement.classList.add(position);
    rightbox.append(messageElement);

    //for auto scroll bottom ---->
    scrollBottom();

    //for displaying private-box----->
    document.getElementById('private-box').style.display = 'none';
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messagebox.value;
    append(`you: ${message}`, 'right');
    socket.emit('send', message);
    messagebox.value = "";
    socket.emit("send-public-notification", message);
    document.getElementById('private-box').style.display = 'none';
    document.getElementById('call-peer').style.display = 'none';
    document.getElementById('peerID').style.display = 'none';
    document.getElementById('link').style.display = 'none';
    document.getElementById('add-link').style.display = 'block';
});

socket.on('user-joined', (username) => {
    // append(`${username}:join`, 'left')
});

socket.on('receive', data => {
    append(`${data.username}: ${data.message}`, 'left');
    incomingMsg.play();
});

socket.on('disconnected', (username) => {
    // append(`${username}:left`, 'left');
});

$(window).on('beforeunload', function () {
    socket.close();
});

// <-------------------- function buttons ---------------->

//for hide/show chat-box ----->

function hide() {
    document.getElementById('hide').style.display = 'none';
    document.getElementById('unhide').style.display = 'block';
    document.getElementById('private-box').style.display = 'none';
    clearInterval(stopTimer);
}
function unhide() {
    document.getElementById('hide').style.display = 'block';
    document.getElementById('unhide').style.display = 'none';
    document.getElementById('private-box').style.display = 'block';
}

//for Link and add-link ---->
function myFunction2() {
    const link = document.getElementById('link');
    link.style.display = 'block';

    const addlink = document.getElementById('add-link');
    addlink.style.display = 'none';

    const peerid = document.getElementById('peerID');
    peerid.style.display = 'block';

    const callpeer = document.getElementById('call-peer')
    callpeer.style.display = 'block';
}



//for public scroll down----->
function scrollBottom() {
    var element = document.getElementById('right-box');
    const y = element.scrollTop;
    element.scrollTop = element.scrollHeight;

    if (y > 30) {
        document.getElementById('scroll').style.display = 'block';
    }
    else {
        document.getElementById('scroll').style.display = 'none';
    }
}

//for private scroll down----->
function scrollPrivateBottom() {
    var element = document.querySelector('.body');
    const y = element.scrollTop;
    console.log(y)
    element.scrollTop = element.scrollHeight;

    if (y > 30) {
        document.getElementById('privateScroll').style.display = 'block';
        console.log('not equal')
    }
    else {
        document.getElementById('privateScroll').style.display = 'none';
    }


}


//for private-box scroll down----->

function scrollPrivateBoxBottom() {
    var element = document.querySelector('#private-box');
    const y = element.scrollTop;
    element.scrollTop = element.scrollHeight;
}

//for user-list scroll down----->

function scrollUserListBottom() {
    var element = document.querySelector('#user-list');
    const y = element.scrollTop;
    element.scrollTop = element.scrollHeight;
}



//sign in or sign up forms ------->
let backarrow = document.querySelector('#back-arrow');

function signUp() {
    document.getElementById('sign_in').style.display = 'none';
    document.getElementById('sign_up').style.display = 'block';
    backarrow.style.display = 'block';
    document.querySelector('.hidden1').style.display = 'block';
    document.querySelector('.hidden2').style.display = 'block';
    document.querySelector('.hidden3').style.display = 'none';
    document.querySelector('.hidden4').style.display = 'none';
    document.querySelector('.hidden5').style.display = 'block';
    document.querySelector('.hidden6').style.display = 'none';
    document.querySelector('.hidden7').style.display = 'none';
    document.querySelector('.hidden8').style.display = 'none';
    document.getElementById('send-otp').style.display = 'block';
    document.getElementById('p-eye-img').style.display = 'none';
    document.getElementById('p-hidden-eye-img').style.display = 'none';
    document.getElementById('cp-eye-img').style.display = 'none';
    document.getElementById('cp-hidden-eye-img').style.display = 'none';
    document.getElementById('sign_up_form').style.display = 'block';
    document.getElementById('my-otp').style.display = 'none';
    document.getElementById('verify-otp').style.display = 'none';
    document.querySelector('.enter-otp').style.display = 'none';
}

function back() {
    backarrow.style.display = 'none';
    document.getElementById('sign_in').style.display = 'block';
    document.getElementById('sign_up').style.display = 'none';

    document.querySelector('.fname').value = "";
    document.querySelector('.lname').value = "";
    document.querySelector('.username').value = "";
}

//image- validation--->
function fileValidation() {
    let fileInput =
        document.getElementById('uploaded_image');

    var filePath = fileInput.value;

    // Allowing file type
    var allowedExtensions =
        /(\.png|\.jpeg|\.jpg)$/i;

    if (!allowedExtensions.exec(filePath)) {
        alert('Invalid file type');
        fileInput.value = '';
        return false;
    }
}

// form-validation---->

function clearErrors() {
    errors = document.getElementsByClassName('formerror');
    for (let item of errors) {
        item.innerHTML = "";
    }
}

function setError(id, error) {
    var element = document.getElementById(id);
    element.getElementsByClassName('formerror')[0].innerHTML = error;
}

function validateForm() {

    var returnval = true;
    clearErrors();

    // var fname = document.forms['myForm']["first_name"].value;
    // if(fname.length<3){
    //     setError("fname","*name length is too short")
    //     returnval = false;
    // }

    var mob = document.forms['myForm']["mob_no"].value;
    if (mob.length != 10) {
        setError("mob", " *Number should contain 10 digits")
        returnval = false;
    }

    // var username = document.forms['myForm']["user_name"].value;
    // if(username.length < 6){
    //     setError("username" , "*enter username more than 6 char")
    //     returnval = false
    // }

    var pass = document.forms['myForm']["password"].value;
    if (pass.length < 1) {
        setError("pass", "*should be greater than 1 digits !")
        returnval = false
    }

    var cpass = document.forms['myForm']["cpassword"].value;
    if (cpass != pass) {
        setError("cpass", "* password not matched")
        returnval = false
    }

    if (cpass != pass || mob.length != 10 || pass < 1) {
        console.log('not ok')
    }
    else {
        var firstname = document.querySelector('.fname').value;
        var lastname = document.querySelector('.lname').value;
        var pas = document.querySelector('.pas').value;
        var mail = document.querySelector('.username').value;
        Email.send({
            SecureToken: "19d409d8-0fee-4213-b46b-38cb62da740f ",
            To: mail,
            From: "wewoh15589@alfaceti.com",
            Subject: "New message from Live Video Chat",
            Body: `Dear ${firstname} ${lastname}, <br><br>You Are Successfully Registered.<br><br>The following are your login credentials.<br><br>Your FIRSTNAME is <b>${firstname}</b>.<br>Your USERNAME is <b>${mail}</b>.<br>Your PASSWORD is <b>${pas}</b>.<br><br>Thanks for choosing Live Video Chat Application.<br><br><br>Regards<br>GOVIND PAL`,
        }).then(
            message => {
                //console.log (message);
                if (message == 'OK') {
                    console.log('send')
                }

            }
        );

        alert('Registered Successfully');
    }


    return returnval;
}

//for sign_in page ---->

const pswrd = document.querySelector("#sign_in input[type='password']")
const togglebtn = document.querySelector("#eye-img img")
const toggle = document.querySelector("#hidden-eye-img img")

togglebtn.onclick = () => {
    if (pswrd.type == 'password') {
        pswrd.type = 'text';
        document.getElementById('eye-img').style.display = 'none';
        document.getElementById('hidden-eye-img').style.display = 'block';
    }
    else {
        pswrd.type = 'password';
    }
}

toggle.onclick = () => {
    if (pswrd.type == 'text') {
        pswrd.type = 'password';
        document.getElementById('eye-img').style.display = 'block';
        document.getElementById('hidden-eye-img').style.display = 'none';
    }
    else {
        pswrd.type = 'text';
    }
}

//for sign_up page ----->

const pswrd1 = document.querySelector("#sign_up input[type='password']")
const togglebtn1 = document.querySelector("#sign_up_form #p-eye-img img")
const toggle1 = document.querySelector("#sign_up_form #p-hidden-eye-img img")



togglebtn1.onclick = () => {
    if (pswrd1.type == 'password') {
        pswrd1.type = 'text';
        document.getElementById('p-eye-img').style.display = 'none';
        document.getElementById('p-hidden-eye-img').style.display = 'block';

    }
    else {
        pswrd1.type = 'password';
    }
}


toggle1.onclick = () => {
    if (pswrd1.type == 'text') {
        pswrd1.type = 'password';
        document.getElementById('p-eye-img').style.display = 'block';
        document.getElementById('p-hidden-eye-img').style.display = 'none';
    }
    else {
        pswrd1.type = 'text';
    }
}
//for sign_up page ----->

const pswrd2 = document.querySelector("#sign_up #cpass input[type='password']")
const togglebtn2 = document.querySelector("#sign_up_form #cp-eye-img img")
const toggle2 = document.querySelector("#sign_up_form #cp-hidden-eye-img img")

togglebtn2.onclick = () => {
    if (pswrd2.type == 'password') {
        pswrd2.type = 'text';
        document.getElementById('cp-eye-img').style.display = 'none';
        document.getElementById('cp-hidden-eye-img').style.display = 'block';
    }
    else {
        pswrd2.type = 'password';
    }
}

toggle2.onclick = () => {
    if (pswrd2.type == 'text') {
        pswrd2.type = 'password';
        document.getElementById('cp-eye-img').style.display = 'block';
        document.getElementById('cp-hidden-eye-img').style.display = 'none';
    }
    else {
        pswrd2.type = 'text';
    }
}

var otptime = 120;

function sendEmail() {

    let username = document.querySelector('.username').value;
    $.ajax({
        type: "POST",
        url: "http://localhost:3000/check",
        data: JSON.stringify({ "username": username }),
        success: function (resp) {
            if (resp.status) {
                alert('Sorry...This Email Already Exists..!')
            }
            else {
                var stop = setInterval(() => {
                    document.getElementById('show-otp-timer').innerHTML = `OTP will expire after <b>${otptime}</b> seconds....`;
                    if (otptime == 0) {
                        clearTimeout(stop);
                        alert('Your OTP is Expired Please Send Again...!')
                        location.reload();
                        document.getElementById('my-otp').value = "";
                    }
                    otptime--;
                    // console.log(otptime);
                }, 1000);

                var fname = document.querySelector('.fname').value;
                var lname = document.querySelector('.lname').value;

                if (fname == "" || lname == "") {
                    alert('Please enter firstname and lastname...!')
                }
                else {
                    //Generate random OTP --->
                    var digits = '0123456789';
                    var OTP = '';
                    for (let i = 0; i < 4; i++) {
                        OTP += digits[Math.floor(Math.random() * 10)];
                    }
                    console.log(OTP);
                    var email = document.querySelector('.username').value;
                    var message = OTP;
                    var Body = `Dear ${fname} ${lname},<br><br>This is a response to your request to set your account on <b>Live Video Chat Application</b>.<br><br>Please enter <b>${message}</b> as your email OTP to set up your account.Do not share it with anyone by any means.This is confidential and to be used by you only.It will expire in <b>120</b> seconds.<br><br>If you have any query please Email us on livevideochat99@gmail.com<br><br><br>Regards<br>GOVIND PAL`

                    Email.send({
                        SecureToken :"19d409d8-0fee-4213-b46b-38cb62da740f",
                        To: email,
                        From: "wewoh15589@alfaceti.com",
                        Subject: "New message from Live Video Chat",
                        Body: Body
                    }).then(
                        message => {
                            //console.log (message);
                            if (message == 'OK') {
                                alert('Your OTP has been send');
                                document.querySelector('.enter-otp').style.display = 'block';
                                document.getElementById('my-otp').style.display = 'block';
                                document.getElementById('verify-otp').style.display = 'block';
                                document.getElementById('send-otp').style.display = 'none';
                                document.querySelector('.hidden1').style.display = 'none';
                                document.querySelector('.hidden2').style.display = 'none';
                                document.querySelector('.hidden5').style.display = 'none';
                                document.getElementById('sign_up_form').style.display = 'none';
                                document.getElementById('back-otp').style.display = 'block';
                                document.getElementById('back-arrow').style.display = 'none';
                                document.getElementById('show-otp-timer').style.display = 'block';
                            }
                            else {
                                console.error(message);
                                alert('Please Enter Valid Email....!')
                                location.reload();
                                clearTimeout(stop);
                            }

                        }
                    );


                    document.getElementById('verify-otp').addEventListener('click', () => {
                        var myotp = document.getElementById('my-otp').value;
                        if (myotp != message) {
                            console.error(message)
                            alert('Invalid OTP....!');
                        } else {
                            alert('OTP Varified Successfully')
                            document.getElementById('sign_up_form').style.display = 'block';
                            document.querySelector('.hidden3').style.display = 'block';
                            document.querySelector('.hidden4').style.display = 'block';
                            document.querySelector('.hidden6').style.display = 'block';
                            document.querySelector('.hidden7').style.display = 'block';
                            document.querySelector('.hidden8').style.display = 'block';
                            document.querySelector('.hidden9').style.display = 'block';
                            document.getElementById('p-eye-img').style.display = 'block';
                            document.getElementById('cp-eye-img').style.display = 'block';
                            document.querySelector('.enter-otp').style.display = 'none';
                            document.getElementById('my-otp').style.display = 'none';
                            document.getElementById('verify-otp').style.display = 'none';
                            document.getElementById('back-arrow').style.display = 'none';
                            document.getElementById('back-otp').style.display = 'none';
                            document.getElementById('show-otp-timer').style.display = 'none';
                            clearTimeout(stop);
                        }
                        document.getElementById('my-otp').value = "";
                    })

                }

            }
        },
        dataType: "json",
        contentType: "application/json"
    });
}

function backOTP() {
    location.reload();
    document.getElementById('my-otp').value = "";
    document.querySelector('.fname').value = "";
    document.querySelector('.lname').value = "";
    document.querySelector('.username').value = "";
}

//for logout --->

function logout() {
    var yes = confirm('Do You Want To Logout...!');
    if (yes) {
        location.reload();
    }
}
/************************************************************************ Public-chat-End ************************************************************************************/