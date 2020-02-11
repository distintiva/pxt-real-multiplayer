namespace multiplayer {


    export enum SocketState {
        LookingForPlayer,
        Connecting,
        Connected,
        Disconnected,
    }

    export enum SocketMessages {
        Status = 0,
        ConnectRequest = 1,
        ConnectResponse = 2,
        Custom = 3
    }

    export class Session {
        constructor(public readonly id: number, public readonly playerNumber: number) { }
    }

    export class SocketPacket {
        constructor(public readonly data?: Buffer) {
            if (!this.data) this.data = control.createBuffer(32);
        }

        get toString(): string {
            return this.data.toHex();
        }
        
        get messageType(): SocketMessages {
            return this.data[0];
        }

        set messageType(msgType: SocketMessages) {
            this.data[0] = msgType;
        }

        get senderState(): SocketState {
            return this.data[1];
        }

        set senderState(state: SocketState) {
            this.data[1] = state;
        }

        get senderPlayerNumber() {
            return this.data[2];
        }

        set senderPlayerNumber(num: number) {
            this.data[2] = num;
        }

        get sessionId() {
            return this.data.getNumber(NumberFormat.UInt32LE, 3);
        }

        set sessionId(id: number) {
            this.data.setNumber(NumberFormat.UInt32LE, 3, id);
        }

        get arg1() {
            return this.data.getNumber(NumberFormat.Int16LE, 7);
        }

        set arg1(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 7, val);
        }

        get arg2() {
            return this.data.getNumber(NumberFormat.Int16LE, 9)
        }

        set arg2(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 9, val);
        }

        get arg3() {
            return this.data.getNumber(NumberFormat.Int16LE, 11)
        }

        set arg3(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 11, val);
        }

        get arg4() {
            return this.data.getNumber(NumberFormat.Int16LE, 13)
        }

        set arg4(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 13, val);
        }

        get arg5() {
            return this.data.getNumber(NumberFormat.Int16LE, 15)
        }

        set arg5(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 15, val);
        }

        get arg6() {
            return this.data.getNumber(NumberFormat.Int16LE, 17)
        }

        set arg6(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 17, val);
        }

        get arg7() {
            return this.data.getNumber(NumberFormat.Int16LE, 19)
        }

        set arg7(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 19, val);
        }

        get arg8() {
            return this.data.getNumber(NumberFormat.Int16LE, 21)
        }

        set arg8(val: number) {
            this.data.setNumber(NumberFormat.Int16LE, 21, val);
        }


        get arg9_32() {
            return this.data.getNumber(NumberFormat.UInt32LE, 23)
        }

        set arg9_32(val: number) {
            this.data.setNumber(NumberFormat.UInt32LE, 23, val);
        }

        get arg10_32() {
            return this.data.getNumber(NumberFormat.UInt32LE, 27)
        }

        set arg10_32(val: number) {
            this.data.setNumber(NumberFormat.UInt32LE, 27, val);
        }

    }

    export class Socket extends jacdac.Broadcast {
        private static instance: Socket;

        public static getInstance() {
            if (!Socket.instance) Socket.instance = new Socket();
            return Socket.instance;
        }

        public session: Session;
        protected state: SocketState;
        protected serverStartTime: number;
        protected lastReceivedTime: number;

        protected intervalRef: number;

        protected messageListener: (pkt: SocketPacket) => void;
        protected connectListener: () => void;
        protected disconnectListener: () => void;

        private constructor(protected pingInterval = 500, protected timeout = 1000) {
            super("socket", jacdac.CONTROLLER_DEVICE_CLASS, 5);

            this.state = SocketState.LookingForPlayer;
            this.restartPingInterval();
        }

        handlePacket(jd: jacdac.JDPacket): number {
            this.handleMessage(getDevice(jd), new SocketPacket(jd.data));
            return jacdac.DEVICE_OK;
        }

        setPingInteval(millis: number) {
            this.pingInterval = millis;
            this.restartPingInterval();
        }

        protected sendMessage(messageType: SocketMessages, message?: SocketPacket) {
            message = message || new SocketPacket();
            message.messageType = messageType;
            message.senderState = this.state;

            if (this.session) {
                message.sessionId = this.session.id;
                message.senderPlayerNumber = this.session.playerNumber;
            }

            this.sendPacket(message.data);
        }

        onConnect(handler: () => void) {
            this.connectListener = handler;
            if (this.state === SocketState.Connected) this.connectListener();
        }

        onDisconnect(handler: () => void) {
            this.disconnectListener = handler;
        }

        onMessage(handler: (pkt: SocketPacket) => void) {
            this.messageListener = handler;
        }

        serverTime() {
            return control.millis() - this.serverStartTime;
        }

        sendCustomMessage(message: SocketPacket) {
            this.sendMessage(SocketMessages.Custom, message);
        }

        
        protected restartPingInterval() {
            if (this.intervalRef !== undefined) clearInterval(this.intervalRef);

            this.intervalRef = setInterval(() => {
                if (this.state === SocketState.Connected && control.millis() - this.lastReceivedTime > this.timeout) {
                    this.state = SocketState.Disconnected;
                    if (this.disconnectListener) this.disconnectListener();
                }

                this.sendMessage(SocketMessages.Status);
                if (this.state === SocketState.Connecting) {
                    this.sendMessage(SocketMessages.ConnectRequest);
                }

            }, this.pingInterval);
        }

        protected handleMessage(sender: jacdac.JDDevice, packet: SocketPacket) {
            if (this.session && packet.sessionId != this.session.id && this.state != SocketState.Connecting) {
                console.log("Ignoring packet")
                return;
            }

            console.log("Got Packet: " + packet.messageType)

            this.lastReceivedTime = control.millis();

            if (this.state === SocketState.Disconnected) {
                this.startConnection();
            }
            else if (this.state === SocketState.LookingForPlayer && packet.senderState === SocketState.LookingForPlayer) {
                if (sender && sender.device_address < this.device.device_address) {
                    this.tryToConnect();
                }
                else {
                    console.log(`skip conn ${sender.udidl}<${this.device.udidl}|${sender.udidh}<${this.device.udidh}`)
                }
            }

            switch (packet.messageType) {
                case SocketMessages.ConnectResponse:
                    this.startConnection();
                    break;
                case SocketMessages.ConnectRequest:
                    this.handleConnectionRequest(packet);
                    break;
                case SocketMessages.Custom:
                    if (this.messageListener) this.messageListener(packet);
            }
        }

        protected tryToConnect() {
            console.log("Sending Connect Request")
            this.state = SocketState.Connecting;

            // Generate a new session
            this.session = new Session(Math.randomRange(1, 9999999) | 0, Math.randomRange(1, 2));
            this.sendMessage(SocketMessages.ConnectRequest);
        }

        protected handleConnectionRequest(request: SocketPacket) {
            console.log("Got Connect Request")
            if (this.state !== SocketState.LookingForPlayer) return;

            this.session = new Session(request.sessionId, request.senderPlayerNumber === 1 ? 2 : 1);
            this.sendMessage(SocketMessages.ConnectResponse);

            this.startConnection();
        }

        protected startConnection() {
            if (this.state === SocketState.Connected) return;

            console.log("Connected")

            this.serverStartTime = control.millis();
            this.state = SocketState.Connected;
            if (this.connectListener) this.connectListener();
        }
    }

    function getDevice(packet: jacdac.JDPacket) {
        return jacdac.devices().find(d => d.device_address === packet.device_address);
    }
}
