var mvs = require("Matchvs");
var uiPanel = require("uiPanel");
cc.Class({
    extends: uiPanel,

    properties: {
        bgmAudio: {
            default: null,
            url: cc.AudioClip
        },
        powerGauge: {
            default: null,
            type: cc.ProgressBar
        },
        fireCd: 0
    },
    onLoad() {
        this._super();
        this.isPowerGauge = false;
        this.curFireCd = this.fireCd;
        this.progressSpeed = 1;
        this.nodeDict["right"].on(cc.Node.EventType.TOUCH_START, this.rightStart, this);
        this.nodeDict["right"].on(cc.Node.EventType.TOUCH_END, this.rightCancel, this);
        this.nodeDict["left"].on(cc.Node.EventType.TOUCH_START, this.leftStart, this);
        this.nodeDict["left"].on(cc.Node.EventType.TOUCH_END, this.leftCancel, this);
        this.nodeDict["powerButton"].on(cc.Node.EventType.TOUCH_START, this.startPowerGauge, this);
        this.nodeDict["powerButton"].on(cc.Node.EventType.TOUCH_END, this.sendFireMsg, this);

    },

    leaveRoom(data) {
        if (Game.GameManager.gameState !== GameState.Over) {
            uiFunc.openUI("uiTip", function(obj) {
                var uiTip = obj.getComponent("uiTip");
                if (uiTip) {
                    if (data.leaveRoomInfo.userId !== GLB.userInfo.id) {
                        uiTip.setData("对手离开了游戏");
                    }
                }
            }.bind(this));
        }
    },

    rightStart() {
        this.sendDirectMsg(DirectState.Right);
    },

    rightCancel() {
        this.sendDirectMsg(DirectState.None);
    },

    leftStart() {
        this.sendDirectMsg(DirectState.Left);
    },

    leftCancel() {
        this.sendDirectMsg(DirectState.None);
    },

    sendDirectMsg(direction) {
        if (Game.GameManager.gameState === GameState.Play) {
            mvs.engine.sendFrameEvent(JSON.stringify({
                action: GLB.DIRECTION,
                direction: direction
            }));
        }
    },

    // 蓄力--
    startPowerGauge() {
        this.isPowerGauge = true;
    },

    sendFireMsg() {
        if (this.curFireCd < 0) {
            this.curFireCd = this.fireCd;
            Game.PlayerManager.self.firePreAnim();
            setTimeout(function() {
                if (Game.GameManager.gameState === GameState.Play) {
                    mvs.engine.sendFrameEvent(JSON.stringify({
                        action: GLB.FIRE
                    }));
                }
            }, 2000);
        }
        this.powerGauge.progress = 0;
        this.isPowerGauge = false;
    },

    update(dt) {
        this.curFireCd -= dt;
        if (this.isPowerGauge) {
            this.powerGauge.progress += this.progressSpeed * dt;
        }
    }
});
