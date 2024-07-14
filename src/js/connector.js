console.log("Im building a powerup!")

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
                                return [{
                                    text: incompleteChecklistItems[0].name,
                                }]
                            }

                            
                            
                            return []
                        })
                }
                return [];
            });
    }
});

