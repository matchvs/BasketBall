cc.Class({
    extends: cc.Component,

    properties: {
        selfNode: cc.Node,
        rivalNode: cc.Node,
        selfIcon: cc.Node,
        rivalIcon: cc.Node,
        iconBg: cc.Node,
        selfScoreNode: cc.Node,
        rivalScoreNode: cc.Node
    },

    onLoad() {
        Game.PlayerManager = this;
        this.self = this.selfNode.getComponent("player");
        this.self.init(GLB.playerUserIds[0]);
        this.rival = this.rivalNode.getComponent("player");
        this.rival.init(GLB.playerUserIds[1]);
        if (!GLB.isRoomOwner) {
            var selfIconPos = this.rivalIcon.position;
            this.rivalIcon.position = this.selfIcon.position;
            this.selfIcon.position = selfIconPos;

            var selfScorePos = this.rivalScoreNode.position;
            this.rivalScoreNode.position = this.selfScoreNode.position;
            this.selfScoreNode.position = selfScorePos;

            this.iconBg.scaleX *= -1;
        }
    },

    getPlayerByUserId(playerId) {
        if (playerId === GLB.playerUserIds[0]) {
            return this.self;
        } else {
            return this.rival;
        }
    }
});
