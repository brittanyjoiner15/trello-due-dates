const dateIcon = "https://storage.googleapis.com/due-date-power-up/due%20date%20power-up%20icon%20(1).png"
const nextItemIcon = "https://storage.googleapis.com/due-date-power-up/nextItem.png"
const trelloAppName = 'Due%20Dates%20from%20Checklist';
const WHITE_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-white.svg';
const BLACK_ICON = 'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-black.svg';


console.log("Im building a powerup!")

var authenticationSuccess = function () {
    console.log('Successful authentication');
};

var authenticationFailure = function () {
    console.log('Failed authentication');
};

var onBtnClick = function (t, opts) {
    console.log('Someone clicked the button');
    window.Trello.authorize({
        type: 'popup',
        name: trelloAppName,
        scope: {
            read: 'true',
            write: 'true'
        },
        expiration: 'never',
        success: authenticationSuccess,
        error: authenticationFailure
    });
};

// authorize flow
export const authorizeFlow = async function (licenseContext) {
    if (navigator.cookieEnabled) {
        licenseContext.trelloIframeContext.getRestApi().authorize({ scope: 'read,write' })
            .then(function (t) {
                console.log('Power-Up was authorized with Trello');
                if (t) {
                    licenseContext.setAuthorizeStatus(true);
                }
            });
    } else {
        // if a user disabled third-party cookies, we cannot call the getRestApi() library and we need to handle get and set of the token
        const url = `https://trello.com/1/authorize?name=${trelloAppName}&scope=read,write&response_type=token&key=%%APP_KEY%%&response_type=token&callback_method=postMessage&return_url=${window.origin}`;
        const t = window.TrelloPowerUp.iframe();

        const authorizeOpts = {
            windowCallback: function (authorizeWindow) {
                // This callback gets called with the handle to the authorization window
                window.addEventListener('message', async function (event) {
                    await authHandler(event, authorizeWindow, licenseContext, t);
                }, false);
            }
        };

        t.authorize(url, authorizeOpts);
    }
};

// write a function that takes a timestamp and returns a string in the format "MM/DD/YYYY"
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}


// define badge object
function createBadge(text, color, type) {
    return {
        text: type === "date" ? formatDate(text) : `NEXT 👉 ${text}`,
        color: color,
        icon: type === "date" ? dateIcon : nextItemIcon
    }
}

// function to update the due date with the next items due date
async function updateDueDate(cardId, date) {
    console.log("updating due date", date)
    const url = `https://api.trello.com/1/cards/${cardId}?due=${date}&key=%%APP_KEY%%&token=%%APP_TOKEN%%`
    try {
        const response = await fetch(url, {
            method: 'PUT',
        })
        if (!response.ok) {
            throw new Error('Failed to update due date')
        }

        const json = await response.json();
        console.log(json);
    } catch (error) {
        console.error(error.message);
    }

}

// function to update the member with the next items member ✅
async function updateMember(cardId, memberId) {
    console.log("updating member", memberId)
    const url = `https://api.trello.com/1/cards/${cardId}/idMembers?value=${memberId}&key=%%APP_KEY%%&token=%%APP_TOKEN%%`
    try {
        const response = await fetch(url, {
            method: 'POST',
        })
        if (!response.ok) {
            throw new Error('Failed to update member')
        }

        const json = await response.json();
        console.log("json response", json);
    } catch (error) {
        console.error("error", error);
    }

}


//complete due date when last checklist item is completed ✅
async function completeDueDate(cardId, date) {
    console.log("updating due date", date)
    const url = `https://api.trello.com/1/cards/${cardId}?dueComplete=true&key=%%APP_KEY%%&token=%%APP_TOKEN%%`
    try {
        const response = await fetch(url, {
            method: 'PUT',
        })
        if (!response.ok) {
            throw new Error('Failed to complete due date')
        }

        const json = await response.json();
        console.log(json);
    } catch (error) {
        console.error(error.message);
    }

}

// function to get all checklist items on a card
function extractCheckItemsAndSort(arr) {
    const extractedItems = arr.reduce((acc, obj) => {
        if (obj.checkItems && Array.isArray(obj.checkItems)) {
            acc.push(...obj.checkItems);
        }
        return acc;
    }, []);

    const sortedItems = extractedItems.sort((a, b) => {
        if (a.due === null) return 1;
        if (b.due === null) return -1;
        return new Date(a.due) - new Date(b.due);
    });

    return sortedItems;
}


function getCheckListItems(checklistId) {
    return fetch(`https://api.trello.com/1/checklists/${checklistId}/checkItems?key=%%APP_KEY%%&token=%%APP_TOKEN%%`)
}




window.TrelloPowerUp.initialize({
    'card-badges': function (t, opts) {
        return t.card('all')
            .then(function (card) {
                console.log(card.checklists);
                // authorizeFlow();
                // console.log("testing auth flow", authorizeFlow);
                if (card.checklists.length > 0) {
                    // if it has a checklist, lets look up checklist information
                    return fetch(`https://api.trello.com/1/cards/${card.id}/?checklists=all&key=%%APP_KEY%%&token=%%APP_TOKEN%%`)
                        .then(function (response) {
                            console.log("response", response)
                            return response.json();
                        })
                        .then(function (checklistData) {
                            const allItems = extractCheckItemsAndSort(checklistData.checklists)
                            const allIncompleteItems = allItems.filter(item => item.state === "incomplete")
                            if (allIncompleteItems.length > 0 && allIncompleteItems[0].due) {
                                updateDueDate(card.id, allIncompleteItems[0].due)
                                // also update the member if there is one
                                if (allIncompleteItems[0].idMember) {
                                    updateMember(card.id, allIncompleteItems[0].idMember)
                                }
                                console.log("next due item name", allIncompleteItems[0].name)
                                console.log("next due item member", allIncompleteItems[0].idMember)
                                return [
                                    createBadge(allIncompleteItems[0].name, "blue", "item"),
                                ]
                            }

                            if (allIncompleteItems.length === 0) {
                                console.log("all items complete")
                                completeDueDate(card.id)
                                return [createBadge("All items complete", "green", "notDate")]
                            }


                            return []
                        })
                }
                return [];
            });
    },
    'board-buttons': function (t, opts) {
        return [{
            // we can either provide a button that has a callback function
            icon: {
                dark: WHITE_ICON,
                light: BLACK_ICON
            },
            text: 'Callback',
            callback: onBtnClick,
            condition: 'edit'
        }, {
            // or we can also have a button that is just a simple url
            // clicking it will open a new tab at the provided url
            icon: {
                dark: WHITE_ICON,
                light: BLACK_ICON
            },
            text: 'URL',
            condition: 'always',
            url: 'https://trello.com/inspiration',
            target: 'Inspiring Boards' // optional target for above url
        }];
    }
});

