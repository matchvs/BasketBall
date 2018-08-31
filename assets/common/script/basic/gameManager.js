var mvs = require("Matchvs");
cc.Class({
    extends: cc.Component,

    blockInput() {
        Game.GameManager.getComponent(cc.BlockInputEvents).enabled = true;
        setTimeout(function() {
            Game.GameManager.node.getComponent(cc.BlockInputEvents).enabled = false;
        }, 1000);
    },

    onLoad() {
        Game.GameManager = this;
        cc.game.addPersistRootNode(this.node);
        cc.director.getCollisionManager().enabled = true;
        cc.director.getPhysicsManager().enabled = true;
        // cc.director.getPhysicsManager().debugDrawFlags = 1;
        clientEvent.init();
        dataFunc.loadConfigs();
        cc.view.enableAutoFullScreen(false);
        this.rivalScore = 0;
        this.selfScore = 0;
        this.gameTime = 0;
        this.isRivalLeave = false;
        clientEvent.on(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.on(clientEvent.eventType.leaveRoomNotify, this.leaveRoom, this);
        this.network = window.network;
        this.network.chooseNetworkMode();
        this.getRankDataListener();
        this.findPlayerByAccountListener();
        if (window.wx) {
            wx.login({
                success: function() {
                    wx.getUserInfo({
                        fail: function(res) {
                            // iOS 和 Android 对于拒绝授权的回调 errMsg 没有统一，需要做一下兼容处理
                            if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
                                // 处理用户拒绝授权的情况
                            }
                        },
                        success: function(res) {
                            Game.GameManager.nickName = res.userInfo.nickName;
                            Game.GameManager.avatarUrl = res.userInfo.avatarUrl;
                            console.log('success', Game.GameManager.nickName);
                        }
                    });
                }
            });
        }
    },

    leaveRoom: function(data) {
        if (this.gameState === GameState.Play) {
            if (data.leaveRoomInfo.userId !== GLB.userInfo.id) {
                this.isRivalLeave = true;
            }
            clientEvent.dispatch(clientEvent.eventType.leaveRoomMedNotify, data);
            this.gameOver();
        }
    },

    gameOver: function() {
        // 打开结算界面--
        var gamePanel = uiFunc.findUI("uiGamePanel");
        if (gamePanel && Game.GameManager.gameState !== GameState.Over) {
            Game.GameManager.gameState = GameState.Over;
            this.readyCnt = 0;
            setTimeout(function() {
                clientEvent.dispatch(clientEvent.eventType.gameOver);
            }.bind(this), 1500);
            setTimeout(function() {
                uiFunc.openUI("uiVsResult");
            }.bind(this), 3000);
        }
    },

    startGame: function() {
        this.readyCnt = 0;
        this.gameState = GameState.None;
        this.rivalScore = 0;
        this.selfScore = 0;
        this.isRivalLeave = false;
        this.gameTime = GLB.gameTime;
        cc.director.loadScene('game', function() {
            uiFunc.openUI("uiGamePanel", function() {
                this.sendReadyMsg();
            }.bind(this));
        }.bind(this));

        if (GLB.syncFrame === true && GLB.isRoomOwner === true) {
            var result = mvs.engine.setFrameSync(GLB.FRAME_RATE);
            if (result !== 0) {
                console.log('设置帧同步率失败,错误码:' + result);
            }
        }
    },

    setFrameSyncResponse: function(rsp) {
        if (rsp.mStatus !== 200) {
            console.log('设置同步帧率失败，status=' + rsp.status);
        } else {
            console.log('设置同步帧率成功, 帧率为:' + GLB.FRAME_RATE);
        }
    },

    matchVsInit: function() {
        mvs.response.initResponse = this.initResponse.bind(this);
        mvs.response.errorResponse = this.errorResponse.bind(this);
        mvs.response.joinRoomResponse = this.joinRoomResponse.bind(this);
        mvs.response.joinRoomNotify = this.joinRoomNotify.bind(this);
        mvs.response.leaveRoomResponse = this.leaveRoomResponse.bind(this);
        mvs.response.leaveRoomNotify = this.leaveRoomNotify.bind(this);
        mvs.response.joinOverResponse = this.joinOverResponse.bind(this);
        mvs.response.createRoomResponse = this.createRoomResponse.bind(this);
        mvs.response.getRoomListResponse = this.getRoomListResponse.bind(this);
        mvs.response.getRoomDetailResponse = this.getRoomDetailResponse.bind(this);
        mvs.response.getRoomListExResponse = this.getRoomListExResponse.bind(this);
        mvs.response.kickPlayerResponse = this.kickPlayerResponse.bind(this);
        mvs.response.kickPlayerNotify = this.kickPlayerNotify.bind(this);
        mvs.response.registerUserResponse = this.registerUserResponse.bind(this);
        mvs.response.loginResponse = this.loginResponse.bind(this); // 用户登录之后的回调
        mvs.response.logoutResponse = this.logoutResponse.bind(this); // 用户登录之后的回调
        mvs.response.sendEventNotify = this.sendEventNotify.bind(this);
        mvs.response.frameUpdate = this.frameUpdate.bind(this);
        mvs.response.setFrameSyncResponse = this.setFrameSyncResponse.bind(this);
        mvs.response.networkStateNotify = this.networkStateNotify.bind(this);

        var result = mvs.engine.init(mvs.response, GLB.channel, GLB.platform, GLB.gameId);
        if (result !== 0) {
            console.log('初始化失败,错误码:' + result);
        }

        Game.GameManager.blockInput();
    },

    networkStateNotify: function(netNotify) {
        console.log("netNotify");
        console.log("netNotify.owner:" + netNotify.owner);
        if (netNotify.userID !== GLB.userInfo.id) {
            GLB.isRoomOwner = true;
        }
        console.log("玩家：" + netNotify.userID + " state:" + netNotify.state);
        if (netNotify.userID !== GLB.userInfo.id) {
            this.isRivalLeave = true;
        }
        clientEvent.dispatch(clientEvent.eventType.leaveRoomMedNotify, netNotify);
        this.gameOver();
    },

    kickPlayerNotify: function(kickPlayerNotify) {
        var data = {
            kickPlayerNotify: kickPlayerNotify
        }
        clientEvent.dispatch(clientEvent.eventType.kickPlayerNotify, data);
    },

    kickPlayerResponse: function(kickPlayerRsp) {
        if (kickPlayerRsp.status !== 200) {
            console.log("失败kickPlayerRsp:" + kickPlayerRsp);
            return;
        }
        var data = {
            kickPlayerRsp: kickPlayerRsp
        }
        clientEvent.dispatch(clientEvent.eventType.kickPlayerResponse, data);
    },

    getRoomListExResponse: function(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 rsp:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        }
        clientEvent.dispatch(clientEvent.eventType.getRoomListExResponse, data);
    },

    getRoomDetailResponse: function(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 rsp:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        }
        clientEvent.dispatch(clientEvent.eventType.getRoomDetailResponse, data);
    },

    getRoomListResponse: function(status, roomInfos) {
        if (status !== 200) {
            console.log("失败 status:" + status);
            return;
        }
        var data = {
            status: status,
            roomInfos: roomInfos
        }
        clientEvent.dispatch(clientEvent.eventType.getRoomListResponse, data);
    },

    createRoomResponse: function(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 createRoomResponse:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        }
        clientEvent.dispatch(clientEvent.eventType.createRoomResponse, data);
    },

    joinOverResponse: function(joinOverRsp) {
        if (joinOverRsp.status !== 200) {
            console.log("失败 joinOverRsp:" + joinOverRsp);
            return;
        }
        var data = {
            joinOverRsp: joinOverRsp
        }
        clientEvent.dispatch(clientEvent.eventType.joinOverResponse, data);
    },

    joinRoomResponse: function(status, roomUserInfoList, roomInfo) {
        if (status !== 200) {
            console.log("失败 joinRoomResponse:" + status);
            return;
        }
        var data = {
            status: status,
            roomUserInfoList: roomUserInfoList,
            roomInfo: roomInfo
        }
        clientEvent.dispatch(clientEvent.eventType.joinRoomResponse, data);
    },

    joinRoomNotify: function(roomUserInfo) {
        var data = {
            roomUserInfo: roomUserInfo
        }
        clientEvent.dispatch(clientEvent.eventType.joinRoomNotify, data);
    },

    leaveRoomResponse: function(leaveRoomRsp) {
        if (leaveRoomRsp.status !== 200) {
            console.log("失败 leaveRoomRsp:" + leaveRoomRsp);
            return;
        }
        var data = {
            leaveRoomRsp: leaveRoomRsp
        }
        clientEvent.dispatch(clientEvent.eventType.leaveRoomResponse, data);
    },

    leaveRoomNotify: function(leaveRoomInfo) {
        var data = {
            leaveRoomInfo: leaveRoomInfo
        }
        clientEvent.dispatch(clientEvent.eventType.leaveRoomNotify, data);
    },

    logoutResponse: function(status) {
        Game.GameManager.network.disconnect();
        console.log("reload lobby");
        cc.game.removePersistRootNode(this.node);
        cc.director.loadScene('lobby');
    },

    errorResponse: function(error, msg) {
        if (error === 1001 || error === 0) {
            uiFunc.openUI("uiTip", function(obj) {
                var uiTip = obj.getComponent("uiTip");
                if (uiTip) {
                    uiTip.setData("网络断开连接");
                }
            });
            setTimeout(function() {
                mvs.engine.logout("");
                cc.game.removePersistRootNode(this.node);
                cc.director.loadScene('lobby');
            }.bind(this), 2500);
        }
        console.log("错误信息：" + error);
        console.log("错误信息：" + msg);
    },

    initResponse: function() {
        console.log('初始化成功，开始注册用户');
        var result = mvs.engine.registerUser();
        if (result !== 0) {
            console.log('注册用户失败，错误码:' + result);
        } else {
            console.log('注册用户成功');
        }
    },

    registerUserResponse: function(userInfo) {
        var deviceId = 'abcdef';
        var gatewayId = 0;
        GLB.userInfo = userInfo;

        console.log('开始登录,用户Id:' + userInfo.id)

        var result = mvs.engine.login(
            userInfo.id, userInfo.token,
            GLB.gameId, GLB.gameVersion,
            GLB.appKey, GLB.secret,
            deviceId, gatewayId
        );
        if (result !== 0) {
            console.log('登录失败,错误码:' + result);
        }
    },

    loginResponse: function(info) {
        if (info.status !== 200) {
            console.log('登录失败,异步回调错误码:' + info.status);
        } else {
            console.log('登录成功');
            this.lobbyShow();
        }
    },

    lobbyShow: function() {
        if (cc.Canvas.instance.designResolution.height > cc.Canvas.instance.designResolution.width) {
            uiFunc.openUI("uiLobbyPanelVer");
        } else {
            uiFunc.openUI("uiLobbyPanel");
        }
    },

    // 玩家行为通知--
    sendEventNotify: function(info) {
        console.log(info);
        var cpProto = JSON.parse(info.cpProto);
        if (info.cpProto.indexOf(GLB.GAME_START_EVENT) >= 0) {
            GLB.playerUserIds = [GLB.userInfo.id];
            var remoteUserIds = JSON.parse(info.cpProto).userIds;
            remoteUserIds.forEach(function(id) {
                if (GLB.userInfo.id !== id) {
                    GLB.playerUserIds.push(id);
                }
            });
            this.startGame();
        }

        if (info.cpProto.indexOf(GLB.GAME_OVER_EVENT) >= 0) {
            this.gameOver();
        }

        if (info.cpProto.indexOf(GLB.READY) >= 0) {
            this.readyCnt++;
            if (GLB.isRoomOwner && this.readyCnt >= GLB.playerUserIds.length) {
                this.sendRoundStartMsg();
            }
        }

        if (info.cpProto.indexOf(GLB.ROUND_START) >= 0) {
            setTimeout(function() {
                Game.GameManager.gameState = GameState.Play;
                this.timeUpdate();
            }.bind(this), 2000);
            clientEvent.dispatch(clientEvent.eventType.roundStart);
        }
    },

    sendReadyMsg: function() {
        var msg = {action: GLB.READY};
        this.sendEventEx(msg);
    },

    sendRoundStartMsg: function() {
        var msg = {action: GLB.ROUND_START};
        this.sendEventEx(msg);
    },

    frameUpdate: function(rsp) {
        for (var i = 0; i < rsp.frameItems.length; i++) {
            if (Game.GameManager.gameState === GameState.Over) {
                return;
            }
            var info = rsp.frameItems[i];
            var cpProto = JSON.parse(info.cpProto);
            if (info.cpProto.indexOf(GLB.DIRECTION) >= 0) {
                if (GLB.userInfo.id === info.srcUserID) {
                    Game.PlayerManager.self.setDirect(cpProto.direction);
                } else {
                    Game.PlayerManager.rival.setDirect(cpProto.direction);
                }
            }

            if (info.cpProto.indexOf(GLB.FIRE_ANIM) >= 0) {
                if (GLB.userInfo.id === info.srcUserID) {
                    Game.PlayerManager.self.firePreAnim();
                } else {
                    Game.PlayerManager.rival.firePreAnim();
                }
            }

            if (info.cpProto.indexOf(GLB.FIRE_EVENT) >= 0) {
                if (GLB.userInfo.id === info.srcUserID) {
                    Game.PlayerManager.self.fireNotify(cpProto.speed);
                } else {
                    Game.PlayerManager.rival.fireNotify(cpProto.speed);
                }
            }

            if (info.cpProto.indexOf(GLB.GAME_TIME) >= 0) {
                this.gameTime--;
                if (this.gameTime < 0) {
                    this.gameTime = 0;
                }
            }

            if (info.cpProto.indexOf(GLB.GOAL_EVENT) >= 0) {
                // cpProto.playerId 为受伤方id--
                if (GLB.userInfo.id === cpProto.playerId) {
                    Game.PlayerManager.self.hitNotify();
                    this.rivalScore++;
                } else {
                    Game.PlayerManager.rival.hitNotify();
                    this.selfScore++;
                }
                clientEvent.dispatch(clientEvent.eventType.score);
            }
        }
        if (Game.PlayerManager && Game.PlayerManager.self && Game.PlayerManager.rival) {
            if (Math.abs(Game.PlayerManager.self.targetPosX - Game.PlayerManager.rival.targetPosX) < GLB.playerMinDistance) {
                if (Game.PlayerManager.self.targetPosX < Game.PlayerManager.rival.targetPosX) {
                    Game.PlayerManager.self.targetPosX -= GLB.bounceDistance;
                    Game.PlayerManager.rival.targetPosX += GLB.bounceDistance;
                } else {
                    Game.PlayerManager.self.targetPosX += GLB.bounceDistance;
                    Game.PlayerManager.rival.targetPosX -= GLB.bounceDistance;
                }
            }
            Game.PlayerManager.self.move();
            Game.PlayerManager.rival.move();

        }
    },

    timeUpdate: function() {
        clearInterval(Game.GameManager.timeId);
        Game.GameManager.timeId = setInterval(function() {
            if (!this || !this.node) {
                return;
            }
            if (GLB.isRoomOwner) {
                if (Game.GameManager.gameTime <= 0 || Game.GameManager.gameState === GameState.Over) {
                    clearInterval(Game.GameManager.timeId);
                    Game.GameManager.sendEventEx({action: GLB.GAME_OVER_EVENT});
                } else {
                    mvs.engine.sendFrameEvent(JSON.stringify({
                        action: GLB.GAME_TIME,
                    }));
                }
            } else {
                if (Game.GameManager.gameTime <= 0 || Game.GameManager.gameState === GameState.Over) {
                    clearInterval(Game.GameManager.timeId);
                }
            }
        }.bind(this), 1000);
    },

    getRankDataListener: function() {
        this.network.on("connector.rankHandler.getRankData", function(recvMsg) {
            uiFunc.openUI("uiRankPanelVer", function(obj) {
                var uiRankPanel = obj.getComponent("uiRankPanel");
                uiRankPanel.setData(recvMsg.rankArray);
            });
        }.bind(this));
    },

    findPlayerByAccountListener: function() {
        this.network.on("connector.entryHandler.findPlayerByAccount", function(recvMsg) {
            clientEvent.dispatch(clientEvent.eventType.playerAccountGet, recvMsg);
        });
    },

    loginServer: function() {
        if (!this.network.isConnected()) {
            this.network.connect(GLB.IP, GLB.PORT, function() {
                    this.network.send("connector.entryHandler.login", {
                        "account": GLB.userInfo.id + "",
                        "channel": "0",
                        "userName": Game.GameManager.nickName ? Game.GameManager.nickName : GLB.userInfo.id + "",
                        "headIcon": Game.GameManager.avatarUrl ? Game.GameManager.avatarUrl : "-"
                    });
                    setTimeout(function() {
                        this.network.send("connector.rankHandler.updateScore", {
                            "account": GLB.userInfo.id + "",
                            "game": GLB.GAME_NAME
                        });
                    }.bind(this), 500);
                }.bind(this)
            );
        } else {
            this.network.send("connector.rankHandler.updateScore", {
                "account": GLB.userInfo.id + "",
                "game": GLB.GAME_NAME
            });
        }
    },

    userInfoReq: function(userId) {
        if (!Game.GameManager.network.isConnected()) {
            Game.GameManager.network.connect(GLB.IP, GLB.PORT, function() {
                    Game.GameManager.network.send("connector.entryHandler.login", {
                        "account": GLB.userInfo.id + "",
                        "channel": "0",
                        "userName": Game.GameManager.nickName ? Game.GameManager.nickName : GLB.userInfo.id + "",
                        "headIcon": Game.GameManager.avatarUrl ? Game.GameManager.avatarUrl : "-"
                    });
                    setTimeout(function() {
                        Game.GameManager.network.send("connector.entryHandler.findPlayerByAccount", {
                            "account": userId + "",
                        });
                    }, 200);
                }
            );
        } else {
            Game.GameManager.network.send("connector.entryHandler.findPlayerByAccount", {
                "account": userId + "",
            });
        }
    },

    sendEventEx: function(msg) {
        var result = mvs.engine.sendEventEx(0, JSON.stringify(msg), 0, GLB.playerUserIds);
        if (result.result !== 0) {
            console.log(msg.action, result.result);
        }
    }
});
