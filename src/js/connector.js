console.log("Im building a powerup!")

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
                            console.log("incomplete items", checklistItems.filter(item => item.state === "incomplete"))
                            return [{
                                text: incompleteChecklistItems[0].name,
                            }]
                        })
                }

                return [];
            });
    }
});

