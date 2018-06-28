var mvs = require("Matchvs");
cc.Class({
    extends: cc.Component,
    properties: {
        speed: 0,
        firePoint: cc.Node,
        fireAnimation: cc.Animation,
        hitAnimation: cc.Animation
    },
    init: function(userId) {
        this.direction = DirectState.None;
        this.playerId = userId;
        this.targetPosX = this.node.x;
    },

    firePreAnim: function() {
        this.fireAnimation.play();
    },

    fireNotify: function() {
        console.log("fire");
    },

    move() {
        var dir = this.direction === DirectState.None ? 0 :
            this.direction === DirectState.Left ? -1 : 1;
        var deltaX = (1 / GLB.FRAME_RATE) * this.speed * dir;
        this.targetPosX += deltaX;
        if (this.targetPosX < -GLB.limitX) {
            this.targetPosX = -GLB.limitX;
        }
        if (this.targetPosX > GLB.limitX) {
            this.targetPosX = GLB.limitX;
        }
    },

    setDirect(dir) {
        this.direction = dir;
    },

    hitEvent() {
        this.hitAnimation.play();
    },

    update(dt) {
        if(this.targetPosX) {
            this.node.x = cc.lerp(this.node.x, this.targetPosX, 4 * dt);
        }
    },


    onDestroy() {
        clearInterval(this.rotateID);
    }

});
