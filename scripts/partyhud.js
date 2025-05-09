Hooks.on('createActor', updatePartyHUD);
Hooks.on('updateActor', updatePartyHUD);
Hooks.on('deleteActor', updatePartyHUD);
Hooks.on('createJournalEntry', updatePartyHUD);
Hooks.on('deleteJournalEntry', updatePartyHUD);
Hooks.once('ready', createPartyHUD);

let initialSettings = {};

//#region Settings
Hooks.once("init", function () {
  game.settings.register("party-hud", "defaultCollapsed", {
    name: "Start Collapsed",
    hint: "If enabled, Party HUD starts in its collapsed (nametag-only) state.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("party-hud", "enableJournalButton", {
    name: "Enable Journal Button",
    hint: "Show a journal button for characters with matching entries.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("party-hud", "enableSheetClick", {
    name: "Click Opens Character Sheet",
    hint: "Enable clicking character portraits to open their sheets.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("party-hud", "enableNameBar", {
    name: "Display Name Bar",
    hint: "Display the character's name on their portrait.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("party-hud", "portraitWidth", {
    name: "Portrait Width",
    hint: "Set the width of the character portrait boxes (in pixels).",
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 50,
      max: 300,
      step: 10
    },
    default: 150
  });

  game.settings.register("party-hud", "portraitHeight", {
    name: "Portrait Height",
    hint: "Set the height of the character portrait boxes (in pixels).",
    scope: "client",
    config: true,
    type: Number,
    range: {
      min: 50,
      max: 300,
      step: 10
    },
    default: 200
  });

  initialSettings = {
    journalButton: game.settings.get("party-hud", "enableJournalButton"),
    journalButton: game.settings.get("party-hud", "enableSheetClick"),
    journalButton: game.settings.get("party-hud", "enableNameBar"),
    portraitWidth: game.settings.get("party-hud", "portraitWidth"),
    portraitHeight: game.settings.get("party-hud", "portraitHeight"),
  };
});

Hooks.on("closeSettingsConfig", () => {
  const newSettings = {
    journalButton: game.settings.get("party-hud", "enableJournalButton"),
    journalButton: game.settings.get("party-hud", "enableSheetClick"),
    journalButton: game.settings.get("party-hud", "enableNameBar"),
    portraitWidth: game.settings.get("party-hud", "portraitWidth"),
    portraitHeight: game.settings.get("party-hud", "portraitHeight"),
  };

  const changed = Object.keys(initialSettings).some(
    key => initialSettings[key] !== newSettings[key]
  );

  if (changed) {
    Dialog.confirm({
      title: "Reload Required",
      content: "<p>Some Party HUD settings have changed. Reload the page to apply changes?</p>",
      yes: () => window.location.reload(),
      no: () => {},
      defaultYes: true
    });
  }

  initialSettings = newSettings;
});
//#endregion

function createPartyHUD() {
    /*
    if (!game.user?.isGM && !game.user?.isPlayer) {
        console.log("[PartyHUD] ERROR: User is neither GM nor Player - exiting.")
        return;
      }
      else {
        console.log("[PartyHUD] INFO: Initializing module...")
      }
        Commented out because my players appear as neither GM nor Player for some reason.
    */
    // CREATE WRAPPER DIV
    const wrapper = document.createElement("div");
    wrapper.className = "partyhud-wrapper";

    // CREATE PARTY CONTAINER
    const partycontainer = document.createElement("div");
    partycontainer.className = "partyhud-rectangle";
    wrapper.appendChild(partycontainer);

    // CREATE TOGGLE BUTTON
    const collapsedByDefault = game.settings.get("party-hud", "defaultCollapsed");
    const toggleButton = document.createElement('button');
    toggleButton.className = 'partyhud-toggle-button';
    toggleButton.textContent = collapsedByDefault ? '▣' : '☰';

    toggleButton.addEventListener('click', () => {
      const rectangle = document.querySelector('.partyhud-rectangle');
      const portraitHeight = game.settings.get("party-hud", "portraitHeight");
      const isCollapsed = rectangle.classList.toggle('collapsed');
      const panels = document.querySelectorAll('.partyhud-character');
      panels.forEach(panel => {
        panel.style.height = isCollapsed ? "24px" : `${portraitHeight}px`;
      });

      toggleButton.textContent = isCollapsed ? '▣' : '☰';
    });
  
    // APPEND WRAPPER
    const target = document.getElementById("ui-bottom");
    if (target) {
      const uiBottom = document.getElementById("ui-bottom");
      uiBottom.insertBefore(wrapper, uiBottom.firstChild)
    }
    else console.error("[PartyHUD] ERROR: Element 'ui-bottom' not found.");

    // FILL IN PARTY
    updatePartyHUD();

    // APPEND TOGGLE BUTTON
    wrapper.appendChild(toggleButton);

    // COLLAPSE SETTING
    if (collapsedByDefault) {
      partycontainer.classList.toggle('collapsed', isCollapsed);
      //partycontainer.style.maxHeight = `24px`
      const panels = document.querySelectorAll('.partyhud-character');
      panels.forEach(panel => {
        panel.style.height = isCollapsed ? "24px" : `${portraitHeight}px`;
      });
    }
}

function updatePartyHUD() {
    //if (!game.user?.isGM && !game.user?.isPlayer) return;
    partycontainer = document.querySelector('.partyhud-rectangle');
    partycontainer.innerHTML = '';

    // LOOP THROUGH ACTORS OWNED BY PLAYERS
    const pcs = game.actors.filter(actor => actor.type === "character" && actor.hasPlayerOwner);

    pcs.forEach(actor => {
      const imgBox = document.createElement("div");
      imgBox.className = "partyhud-character";
  
      const portraitWidth = game.settings.get("party-hud", "portraitWidth");
      const portraitHeight = game.settings.get("party-hud", "portraitHeight");
      imgBox.style.width = `${portraitWidth}px`;
      imgBox.style.height = `${portraitHeight}px`;

      // CREATE CHARACTER IMAGE
      const img = document.createElement("img");
      img.src = actor.img;
      img.alt = actor.name;
      img.title = actor.name;
      imgBox.appendChild(img);

      // CREATE NAME BANNER
      const displayNameBar = game.settings.get("party-hud", "enableNameBar");
      if (displayNameBar) {
        const nameBanner = document.createElement("div");
        nameBanner.className = "partyhud-name-banner";
        nameBanner.textContent = actor.name;
        imgBox.appendChild(nameBanner);
      }
      
      // CREATE JOURNAL BUTTON
      const enableJournalButton = game.settings.get("party-hud", "enableJournalButton");
      if (enableJournalButton) {
        const journal = game.journal?.contents.find(j => j.name.toLowerCase().replace(' ', '') === actor.name.toLowerCase().replace(' ', ''));

        if (journal) {
          const journalBtn = document.createElement("button");
          journalBtn.textContent = '📓'; //"📓🗒️";
          journalBtn.className = "partyhud-journal-btn";
          journalBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            journal.sheet.render(true);
          });
          imgBox.appendChild(journalBtn)
        }
      }

      // CLICK TO OPEN SHEET
      const enableSheetClick = game.settings.get("party-hud", "enableSheetClick");
      if (enableSheetClick) {
        imgBox.addEventListener("click", (event) => {
          event.preventDefault();
          //console.log("[PartyHUD] INFO: Clicked panel for " + actor.name);
          actor.sheet.render(true);
        });
      }

      togglebutton = document.querySelector('.partyhud-toggle-button')
      if (pcs.count > 0) {
        togglebutton.style.display = "flex";
      }
      else {
        togglebutton.style.display = "none";
      }

      partycontainer.appendChild(imgBox);
    });
  };