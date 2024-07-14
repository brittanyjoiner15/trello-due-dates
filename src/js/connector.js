console.log("Im building a powerup!")

const dateIcon = "https://storage.googleapis.com/due-date-power-up/due%20date%20power-up%20icon%20(1).png"
const nextItemIcon = "https://storage.googleapis.com/due-date-power-up/nextItem.png"

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
        text: type === `date` ? formatDate(text) : text,
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


//complete due date when last checklist item is completed
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


window.TrelloPowerUp.initialize({
    'card-badges': function (t, opts) {
        return t.card('all')
            .then(function (card) {
                console.log(card.checklists);
                if (card.checklists.length > 0) {
                    // if it has a checklist, lets look up checklist information
                    return fetch(`https://api.trello.com/1/cards/${card.id}/?checklists=all&key=%%APP_KEY%%&token=%%APP_TOKEN%%`)
                        .then(function (response) {
                            console.log("response", response)
                            return response.json();
                        })
                        .then(function (checklistData) {
                            const checklistItems = checklistData.checklists[0].checkItems;
                            const incompleteChecklistItems = checklistItems.filter(item => item.state === "incomplete");
                            if (incompleteChecklistItems.length > 0) {
                                console.log("incomplete items", checklistItems.filter(item => item.state === "incomplete"))
                                updateDueDate(card.id, incompleteChecklistItems[0].due)
                                return [ createBadge(incompleteChecklistItems[0].due, "red", "date"), createBadge(incompleteChecklistItems[0].name, "blue", "next") ] 
                            }

                            if (incompleteChecklistItems.length === 0) {
                                console.log("all items complete")
                                completeDueDate(card.id)
                                return [createBadge("All items complete", "green", "date")]
                            }
                            
                            
                            return []
                        })
                }
                return [];
            });
    }
});

