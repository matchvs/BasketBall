var mvs = require("Matchvs");
cc.Class({
    extends: cc.Component,
    properties: {
        boomEffect: cc.Prefab
    },

    onLoad() {
        this.rigibodySelf = this.node.getComponent(cc.RigidBody);
    },

    init(playerId, speed) {
        this.hostPlayerId = playerId;
        this.speed = speed;
        this.rigibodySelf.linearVelocity = cc.v2(this.speed, GLB.speedY);
    },
    onBeginContact: function(contact, selfCollider, otherCollider) {
        if (otherCollider.node.group === 'basket') {
            var player = otherCollider.node.parent.getComponent('player');
            cc.log("goal");
            player.hitAnimation.play();
            this.sendGoalMsg(player.playerId);
            this.destroyPumpkin(false);
        }
        else if (otherCollider.node.group === 'ground') {
            this.destroyPumpkin(true);
        }
    },

    destroyPumpkin(isEffect) {
        if (isEffect) {
            var effect = cc.instantiate(this.boomEffect);
            effect.parent = this.node.parent;
            effect.position = this.node.position;
        }
        this.node.destroy();
    },

    sendGoalMsg(playerId) {
        if (GLB.isRoomOwner) {
            mvs.engine.sendFrameEvent(JSON.stringify({
                action: GLB.GOAL_EVENT,
                playerId: playerId
            }));
        }
    }
});
