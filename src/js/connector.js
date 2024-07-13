console.log("Im building a powerup!")

window.TrelloPowerUp.initialize({
    'card-badges': function (t, opts) {
      return t.card('all').then(function (card) {
        console.log(card.checklists);
        return [{
          text: card.name,
        }];
      });
    }
  });