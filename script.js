try {
  var SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  //recognition.interimResults = true;
  var voiceList = document.querySelector("#voiceList");
  var voices = [];
  GetVoices();
  if (speechSynthesis !== undefined) {
    speechSynthesis.onvoiceschanged = GetVoices;
  }
} catch (e) {
  console.error(e);
  $(".no-browser-support").show();
  $(".app").hide();
}

var noteTextarea = $("#note-textarea");
var instructions = $("#recording-instructions");
var notesList = $("ul#notes");

var noteContent = "";

var notes = getAllNotes();
renderNotes(notes);

//recognition.continuous = true;

recognition.onresult = function (event) {
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;

  var mobileRepeatBug =
    current == 1 && transcript == event.results[0][0].transcript;

  if (!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
};

recognition.onstart = function () {
  recognizing = true;
  instructions.text(
    "Voice recognition activated. Try speaking into the microphone."
  );
  $("#recording-instructions").addClass("blinking");
};

recognition.onspeechend = function () {
  instructions.text(
    "You were quiet for a while so voice recognition turned itself off."
  );
};

recognition.onerror = function (event) {
  if (event.error == "no-speech") {
    instructions.text("No speech was detected. Try again.");
  }
};

function GetVoices() {
  var tts = window.speechSynthesis;
  voices = tts.getVoices();
  voiceList.innerHTML = "";
  voices.forEach((voice) => {
    var listItem = document.createElement("option");
    listItem.textContent = voice.name;
    listItem.setAttribute("data-lang", voice.lang);
    listItem.setAttribute("data-name", voice.name);
    voiceList.appendChild(listItem);
  });
  voiceList.selectedIndex = 0;
}

$("#start-record-btn").on("click", function (e) {
  if (noteContent.length) {
    noteContent += " ";
  }
  recognition.start();
});

$("#pause-record-btn").on("click", function (e) {
  recognition.stop();
  $("#recording-instructions").removeClass("blinking");
  recognizing = false;
  instructions.text("Voice recognition paused.");
});

noteTextarea.on("input", function () {
  noteContent = $(this).val();
});

$("#clear-note-btn").on("click", function (e) {
  //$("#clear-note-btn").text().value = "";
  $("#note-textarea").val("");
});

$("#save-note-btn").on("click", function (e) {
  recognition.stop();

  if (!noteContent.length) {
    instructions.text(
      "Could not save empty note. Please add a message to your note."
    );
  } else {
    // Save voice to localStorage.

    saveNote(new Date().toLocaleString(), noteContent);

    // Reset variables and update UI.
    noteContent = "";
    renderNotes(getAllNotes());
    noteTextarea.val("");
    instructions.text("Note saved successfully.");
  }
});

notesList.on("click", function (e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected voice.
  if (target.hasClass("listen-note")) {
    var content = target.closest(".note").find(".content").text();
    readOutLoud(content);
  }

  // Delete voice.
  if (target.hasClass("delete-note")) {
    var dateTime = target.siblings(".date").text();
    deleteNote(dateTime);
    target.closest(".note").remove();
  }
});

function readOutLoud(message) {
  // var speech = new SpeechSynthesisUtterance();

  // // Set the text and voice attributes.
  // speech.text = message;
  // speech.volume = 1;
  // //speech.rate = 1;
  // //speech.pitch = 1;
  // var selectedVoiceName = voiceList.selectedOptions[0].getAttribute(
  //   "data-name"
  // );
  // voices.forEach((speech) => {
  //   if (speech.name === selectedVoiceName) {
  //     speech.speech = speech;
  //   }
  // });

  // window.speechSynthesis.speak(speech);
  var tts = window.speechSynthesis;
  var toSpeak = new SpeechSynthesisUtterance(message);
  var selectedVoiceName = voiceList.selectedOptions[0].getAttribute(
    "data-name"
  );
  voices.forEach((voice) => {
    if (voice.name === selectedVoiceName) {
      toSpeak.voice = voice;
    }
  });
  tts.speak(toSpeak);
}

function renderNotes(notes) {
  var html = "";
  if (notes.length) {
    notes.forEach(function (note) {
      html += `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">PLAY <i class="fas fa-play"></i></a>
          <a href="#" class="delete-note" title="Delete">DELETE <i class="fas fa-trash"></i></a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;
    });
  } else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}

function saveNote(dateTime, content) {
  localStorage.setItem("note-" + dateTime, content);
}

function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if (key.substring(0, 5) == "note-") {
      notes.push({
        date: key.replace("note-", ""),
        content: localStorage.getItem(localStorage.key(i)),
      });
    }
  }
  return notes;
}

function deleteNote(dateTime) {
  localStorage.removeItem("note-" + dateTime);
}
