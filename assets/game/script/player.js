var mvs = require("Matchvs");
cc.Class({
    extends: cc.Component,
    properties: {
        speed: 0,
        pumpkin: cc.Node,
        pumpkinPrefab: cc.Prefab,
        fireAnimation: cc.Animation,
        hitAnimation: cc.Animation,
        wheel1Node: cc.Node,
        wheel2Node: cc.Node,
        meNode: cc.Node,
        basket: cc.Node,
        body: cc.Node,
        basketBottom: cc.Node,
        fireAudio: {
            default: null,
            url: cc.AudioClip
        },
    },
    init: function(userId) {
        this.direction = DirectState.None;
        this.playerId = userId;
        if (!GLB.isRoomOwner) {
            this.node.scaleX *= -1;
            this.node.x *= -1;
            if (GLB.userInfo.id === userId) {
                if (this.meNode) {
                    this.meNode.scaleX *= -1;
                }
            }
        }
        this.targetPosX = this.node.x;
    },

    firePreAnim: function() {
        this.fireAnimation.play();
        cc.audioEngine.play(this.fireAudio, false, 1);
    },

    fireNotify: function(speed) {
        // 生成导弹
        var pumpkinIns = cc.instantiate(this.pumpkinPrefab);
        var worldPos = this.pumpkin.convertToWorldSpaceAR(cc.v2(0, 0));
        var localPos = Game.PlayerManager.node.convertToNodeSpaceAR(worldPos);
        pumpkinIns.parent = Game.PlayerManager.node;
        pumpkinIns.position = localPos;

        if (GLB.isRoomOwner) {
            if (GLB.userInfo.id === this.playerId) {
                pumpkinIns.getComponent("pumpkin").init(this.playerId, speed);
            } else {
                pumpkinIns.getComponent("pumpkin").init(this.playerId, -speed);
            }
        } else {
            if (GLB.userInfo.id === this.playerId) {
                pumpkinIns.getComponent("pumpkin").init(this.playerId, -speed);
            } else {
                pumpkinIns.getComponent("pumpkin").init(this.playerId, speed);
            }
        }
    },

    // 被投进效果--
    hitNotify: function() {
        var animState = this.hitAnimation.getAnimationState("hitAnim");
        if (!animState.isPlaying) {
            this.hitAnimation.play();
        }
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

    update(dt) {
        if (this.targetPosX) {
            var nextPos = cc.lerp(this.node.x, this.targetPosX, 4 * dt);
            var deltaX = nextPos - this.node.x;
            this.wheel1Node.rotation += 60 * deltaX * dt * Math.sign(this.node.scaleX);
            this.wheel2Node.rotation += 60 * deltaX * dt * Math.sign(this.node.scaleX);
            this.node.x = nextPos;
        }
        this.basket.setPosition(-72, 49);
        this.body.setPosition(40, 0);
        this.basketBottom.setPosition(-72, -1);

    },


    onDestroy() {
        clearInterval(this.rotateID);
    }

});
