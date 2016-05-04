$(function () {
  var $canvas = $('canvas'),
    stage = new PIXI.Container(),
    graphics = new PIXI.Graphics(),
    creature, food, renderer, maxHeight, maxWidth, hive;

  if ($canvas) {
    maxHeight = $canvas.innerHeight();
    maxWidth = $canvas.innerWidth();
  } else {
    maxHeight = 1000;
    maxWidth = 1000;
  }

  creature = new Creature({
    heightBound: maxHeight,
    widthBound: maxWidth,
    location: {x: 100, y: 100},
    agent: new RL.DQNAgent({
      getNumStates: function () {
        return 4;
      },
      getMaxNumActions: function () {
        return 4;
      }
    }, {alpha: 0.01})
  });

  food = [];
  for (i = 0; i < 15; i++) {
    food.push(new Food({
      heightBound: maxHeight,
      widthBound: maxWidth
    }));
  }

  setTimeout(function () {
    $('body').addClass('loaded');

    setTimeout(function () {
      $('header').addClass('show');
      $('canvas').addClass('show');

      renderer = new PIXI.autoDetectRenderer(maxWidth, maxHeight, {
        antialias: true,
        view: $canvas[0]
      });
      renderer.clearBeforeRender = true;

      stage.addChild(graphics);

      render();

      setInterval(function () {
        creature.update(food);
      }, 16);
    }, 1000);
  }, 500);

  function render () {
    graphics.clear();

    for (i = 0; i < food.length; i++) {
      food[i].draw(graphics);
    }
    creature.draw(graphics);

    renderer.render(stage);

    requestAnimationFrame(render);
  }
});

function Creature (config) {
  var me = this;

  me.widthBound = config.widthBound || 100;
  me.heightBound = config.heightBound || 100;
  me.agent = config.agent;
  me.heading = 0;
  me.lastHeading = 0;
  me.location = {
    x: config.location.x || 0,
    y: config.location.y || 0
  };
  me.score = 0;
  me.speed = 5;

  me.draw = function (gfx) {
    gfx.beginFill(0xFF0000, 1);
    gfx.drawCircle(me.location.x, me.location.y, 5);
    gfx.endFill();
  };
  me.update = function (food) {
    var closestFood = food[0],
      distance = Math.sqrt(Math.pow(food[0].location.x - me.location.x, 2) + Math.pow(food[0].location.y - me.location.y, 2)),
      newHeading, wantedHeading;

    me.location.x += me.speed * Math.cos(me.heading);
    me.location.y += me.speed * Math.sin(me.heading);

    if (me.location.x > me.widthBound) {
      me.location.x -= me.widthBound;
    }
    if (me.location.x < 0) {
      me.location.x += me.widthBound;
    }

    if (me.location.y > me.heightBound) {
      me.location.y -= me.heightBound;
    }
    if (me.location.y < 0) {
      me.location.y += me.heightBound;
    }

    for (var i = 1; i < food.length; i++) {
      if (Math.sqrt(Math.pow(food[i].location.x - me.location.x, 2) + Math.pow(food[i].location.y - me.location.y, 2)) < distance) {
        closestFood = food[i];
        distance = Math.sqrt(Math.pow(food[i].location.x - me.location.x, 2) + Math.pow(food[i].location.y - me.location.y, 2));
      }
    }

    newHeading = me.agent.act([
      me.location.x / me.widthBound,
      me.location.y / me.heightBound,
      closestFood.location.x / me.widthBound,
      closestFood.location.y / me.heightBound
    ]);

    me.lastHeading = me.heading;
    me.heading = ((Math.PI * 2) / 4) * newHeading;

    if (me.lastHeading === me.heading) {
      console.log('persisted heading: ' + me.heading);
    }

    if (distance < 50) {
      me.score++;
      me.agent.learn((distance / 50) * -0.1 + 0.1);
    }

    if (distance < 10) {
      closestFood.relocate();
      me.score += 100;
      me.agent.learn(1);

      console.log('Food get! Score is: ' + me.score);
    }
  };
}

function Food (config) {
  var me = this;

  me.widthBound = config.widthBound || 100;
  me.heightBound = config.heightBound || 100;
  me.location = {
    x: 0,
    y: 0
  };

  me.draw = function (gfx) {
    gfx.beginFill(0x00FF00, 1);
    gfx.drawCircle(me.location.x, me.location.y, 5);
    gfx.endFill();
  };
  me.relocate = function () {
    me.location.x = Math.random() * me.widthBound;
    me.location.y = Math.random() * me.heightBound;
  };

  me.relocate();
}

function HiveMind (config) {
  var me = this;

  me.bestCreature = config.bestCreature || {};
  me.widthBound = config.widthBound || 100;
  me.heightBound = config.heightBound || 100;
  me.creatures = [];
  me.currentTick = 0;
  me.currentGenerationTTL = config.generationTTL || 1000;
  me.generationTTL = config.generationTTL || 1000;
  me.mutationRate = config.mutationRate || 0.01;
  me.numCreatures = config.numCreatures || 10;
  me.numNewCreaturesGeneration = config.numNewCreaturesGeneration || 5;
  me.perceptronBlueprint = config.perceptronBlueprint || [2, 20, 1];

  for (var i = 0; i < me.numNewCreaturesGeneration; i++) {
    me.creatures.push(new Creature({
      location: {
        x: Math.random() * me.widthBound,
        y: Math.random() * me.heightBound
      },
      perceptron: new synaptic.Architect.Perceptron(me.perceptronBlueprint[0], me.perceptronBlueprint[1], me.perceptronBlueprint[2]),
      heightBound: me.heightBound,
      widthBound: me.widthBound
    }));
  }
  for (i = me.numNewCreaturesGeneration; i < me.numCreatures; i++) {
    newPerceptron = me.bestCreature;

    for (var i2 = 0; i2 < newPerceptron.connections.length; i2++) {
      if (Math.random() < me.mutationRate) {
        newPerceptron.connections[i2].weight = 0.1 - Math.random() * 0.2;
      }
    }
    for (i2 = 0; i2 < newPerceptron.neurons.length; i2++) {
      if (Math.random() < me.mutationRate) {
        newPerceptron.neurons[i2].bias = 0.1 - Math.random() * 0.2;
      }
    }

    me.creatures.push(new Creature({
      location: {
        x: Math.random() * me.widthBound,
        y: Math.random() * me.heightBound
      },
      perceptron: new synaptic.Network.fromJSON(me.bestCreature),
      heightBound: me.heightBound,
      widthBound: me.widthBound
    }));
  }

  me.draw = function (gfx) {
    for (i = 0; i < me.creatures.length; i++) {
      me.creatures[i].draw(gfx);
    }
  };
  me.update = function (creatures, food) {
    var newPerceptron;

    me.currentTick++;

    for (i = 0; i < me.creatures.length; i++) {
      me.creatures[i].update(food);
    }

    me.currentGenerationTTL--;
    if (me.currentGenerationTTL === 0) {
      if (!me.bestCreature.score) {
        me.bestCreature = me.creatures[0];
      }
      for (i = 0; i < me.creatures.length; i++) {
        if (me.creatures[i].score > me.bestCreature.score) {
          me.bestCreature = me.creatures[i];
        }
      }

      console.log('Current best score: ' + me.bestCreature.score);
      console.log('Current ticks: ' + me.currentTick);

      me.creatures = [];

      for (i = 0; i < me.numNewCreaturesGeneration; i++) {
        me.creatures.push(new Creature({
          location: {
            x: Math.random() * me.widthBound,
            y: Math.random() * me.heightBound
          },
          perceptron: new synaptic.Architect.Perceptron(me.perceptronBlueprint[0], me.perceptronBlueprint[1], me.perceptronBlueprint[2]),
          heightBound: me.heightBound,
          widthBound: me.widthBound
        }));
      }
      for (i = me.numNewCreaturesGeneration; i < me.numCreatures; i++) {
        newPerceptron = me.bestCreature.perceptron.toJSON();

        for (var i2 = 0; i2 < newPerceptron.connections.length; i2++) {
          if (Math.random() < me.mutationRate) {
            newPerceptron.connections[i2].weight = 0.1 - Math.random() * 0.2;
          }
        }
        for (i2 = 0; i2 < newPerceptron.neurons.length; i2++) {
          if (Math.random() < me.mutationRate) {
            newPerceptron.neurons[i2].bias = 0.1 - Math.random() * 0.2;
          }
        }

        me.creatures.push(new Creature({
          location: {
            x: Math.random() * me.widthBound,
            y: Math.random() * me.heightBound
          },
          perceptron: new synaptic.Network.fromJSON(me.bestCreature.perceptron.toJSON()),
          heightBound: me.heightBound,
          widthBound: me.widthBound
        }));
      }

      me.currentGenerationTTL = me.generationTTL;
    }
  };
}
