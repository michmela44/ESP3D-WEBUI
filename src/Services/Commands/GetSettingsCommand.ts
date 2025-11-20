import { Command } from "./Command";

export type Settings = {
    startMessage?: string;
    firmwareBuild?: string;
    wifiMode?: string;
    stationSSID?: string;
    stationPassword?: string;
    stationMinSecurity?: string;
    wifiFastScan?: string;
    stationIpMode?: string;
    stationIP?: string;
    stationGateway?: string;
    stationNetmask?: string;
    stationSsdpEnable?: string;
    apCountry?: string;
    apSSID?: string;
    apPassword?: string;
    apIP?: string;
    apChannel?: string;
    hostname?: string;
};

export class GetSettingsCommand extends Command {
    constructor() {
        super("$Settings/List");
    }

    getSettings(): Settings {
        return {
            startMessage: this.getParam("$Start/Message="),
            firmwareBuild: this.getParam("$Firmware/Build="),
            wifiMode: this.getParam("$WiFi/Mode="),
            stationSSID: this.getParam("$Sta/SSID="),
            stationPassword: this.getParam("$Sta/Password="),
            stationMinSecurity: this.getParam("$Sta/MinSecurity="),
            wifiFastScan: this.getParam("$WiFi/FastScan="),
            stationIpMode: this.getParam("$Sta/IPMode="),
            stationIP: this.getParam("$Sta/IP="),
            stationGateway: this.getParam("$Sta/Gateway="),
            stationNetmask: this.getParam("$Sta/Netmask="),
            apCountry: this.getParam("$AP/Country="),
            apSSID: this.getParam("$AP/SSID="),
            apPassword: this.getParam("$AP/Password="),
            apIP: this.getParam("$AP/IP="),
            apChannel: this.getParam("$AP/Channel="),
            hostname: this.getParam("$Hostname=")
        };
    }

    getParam(param: string): string | undefined {
        return this.response
            .find((line) => line.indexOf(param) === 0)
            ?.substring(param.length);
    }
}
