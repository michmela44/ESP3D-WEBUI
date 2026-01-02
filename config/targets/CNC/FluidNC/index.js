/*
 index.js - ESP3D WebUI Target file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

const chalk = require("chalk")
const wscolor = chalk.cyan
const expresscolor = chalk.green
const commandcolor = chalk.white
let lastconnection = Date.now()
const sessiontTime = 60000
let countStatus = 0
let change = false
const emulationESP400 = false

function getLastconnection() {
    return lastconnection
}

const commandsQuery = (req, res, SendWS) => {
    let url = req.query.cmd ? req.query.cmd : (req.query.plain ? req.query.plain : req.originalUrl)
    if (req.query.cmd)
        console.log(commandcolor(`[server]/command params: ${req.query.cmd}`))  
    else  if (req.query.plain)
        console.log(commandcolor(`[server]/command params: ${req.query.plain}`))
    else console.log(commandcolor(`[server]/command : ${url}`))
    if (url.indexOf("PING") != -1) {
        lastconnection = Date.now()
        res.status(200)
        res.send("ok\n")
        console.log(commandcolor(`[server]/command :PING`))
        return
    }

    lastconnection = Date.now()

    if (req.query.cmd && req.query.cmd == "?") {
        countStatus++
        if (countStatus == 1)
            SendWS(
                "<Idle|MPos:0.000,0.000,0.000,1.000,1.000|FS:0,0|WCO:0.000,0.000,0.000,1.000,1.000>\n"
            )
        if (countStatus == 2)
            SendWS(
                "<Run|MPos:0.000,0.000,0.000,1.000,1.000|SD:0.1,pcb_zebra.gcode||FS:0,0|Ov:100,100,100|Pn:XYZV>\n"
            )
        if (countStatus > 2 && countStatus < 8)
            SendWS(
                "<Run|MPos:0.000,0.000,0.000,1.000,1.000|SD:0.2,pcb_zebra.gcode|FS:0,0|A:S|Pn:P>\n"
            )
        if (countStatus >= 8)
            SendWS(
                "<Run|MPos:0.000,0.000,0.000,1.000,1.000|SD:100.0,pcb_zebra.gcode|FS:0,0|A:S|Pn:P>\n"
            )
        if (countStatus == 10) countStatus = 0

        res.send("")
        return
    }

    if (req.query.plain)
    {
        url = req.query.plain.toLowerCase()
        switch (url) {
            // Add cases here if needed
            case "$settings/list":
                res.status(200)
                res.send("$Grbl/SoftLimitsEnable=0\n$Grbl/HardLimitsEnable=0\n$Grbl/HomingCycleEnable=0\n$Grbl/HomingDirections=0\n$Grbl/MaxSpindleSpeed=0\n$Grbl/LaserMode=0\n$Grbl/Resolution/X=80.000\n$Grbl/Resolution/Y=80.000\n$Grbl/Resolution/Z=80.000\n$Grbl/MaxRate/X=1000.000\n$Grbl/MaxRate/Y=1000.000\n$Grbl/MaxRate/Z=1000.000\n$Grbl/Acceleration/X=25.000\n$Grbl/Acceleration/Y=25.000\n$Grbl/Acceleration/Z=25.000\n$Grbl/MaxTravel/X=1000.000\n$Grbl/MaxTravel/Y=1000.000\n$Grbl/MaxTravel/Z=1000.000\n$Notification/Type=NONE\n$Notification/T1=\n$Notification/T2=\n$Notification/TS=\n$Telnet/Enable=ON\n$Telnet/Port=23\n$HTTP/BlockDuringMotion=ON\n$HTTP/Enable=ON\n$HTTP/Port=80\n$MDNS/Enable=ON\n$WiFi/PsMode=None\n$WiFi/Mode=STA>AP\n$Sta/Password=********\n$Sta/MinSecurity=WPA2-PSK\n$WiFi/FastScan=OFF\n$Sta/IPMode=DHCP\n$Sta/IP=\n$Sta/Gateway=0.0.0.0\n$Sta/Netmask=0.0.0.0\n$AP/Country=01\n$AP/SSID=FluidNCfghj\n$AP/Password=********\n$AP/IP=192.168.0.1\n$AP/Channel=1\n$Hostname=fluidnc\n$Sta/SSID=BlackWidow\n$GCode/Echo=OFF\n$Start/Message=Grbl \V [FluidNC \B (\R) \H]\n$Firmware/Build=\n$SD/FallbackCS=-1\n$Report/Status=1\n$Config/Filename=config.yaml\n$Message/Level=Info\n")
                return
        }
    }

    if (url.indexOf("SIM:") != -1) {
        const response = url.substring(url.indexOf("SIM:") + 4)
        SendWS(response + "\n" + "ok\n")
        res.send("")
        return
    }

    if (url.indexOf("ESP800") != -1) {
        res.json({
            cmd: "800",
            status: "ok",
            data: {
                FWVersion: "3.0.0.a111",
                FWTarget: "FluidNC",
                FWTargetID: "80",
                Setup: "Enabled",
                WebUpdate: "Enabled",
                SDConnection: "direct",
                SerialProtocol: "Socket",
                Authentication: "Disabled",
                WebCommunication: "Synchronous",
                WebSocketIP: "localhost",
                WebSocketPort: "82",
                HostName: "fluidnc",
                WiFiMode: "STA",
                wled: "Enabled",
                FlashFileSystem: "LittleFS",
                HostPath: "/",
                Time: "none",
                Axisletters: "XYZUV",
            },
        })
        return
    }
    if (url.indexOf("ESP111") != -1) {
        res.send("192.168.1.111")
        return
    }

    if (url.indexOf("ESP401") != -1) {
        const reg_search1 = /P=(?<pos>[^\s]*)/i
        let posres = null
        if ((posres = reg_search1.exec(url)) == null) {
            console.log("Cannot find P= in url")
        }
        res.json({
            cmd: "401",
            status: "ok",
            data: posres.groups.pos ? posres.groups.pos : "Unknown position",
        })
        return
    }

    if (url.indexOf("ESP420") != -1) {
        res.json({
 "cmd": "420",
 "status": "ok",
 "data": [
  {
   "id": "Chip ID",
   "value": "33806"
  },
  {
   "id": "CPU Cores",
   "value": "2"
  },
  {
   "id": "CPU Frequency",
   "value": "240Mhz"
  },
  {
   "id": "CPU Temperature",
   "value": "53.3°C"
  },
  {
   "id": "Free memory",
   "value": "120.74 KB"
  },
  {
   "id": "SDK",
   "value": "v4.4.7-dirty"
  },
  {
   "id": "Flash Size",
   "value": "4.00 MB"
  },
  {
   "id": "Sleep mode",
   "value": "Modem"
  },
  {
   "id": "Available Size for update",
   "value": "1.88 MB"
  },
  {
   "id": "Available Size for LocalFS",
   "value": "192.00 KB"
  },
  {
   "id": "Web port",
   "value": "80"
  },
  {
   "id": "Data port",
   "value": "23"
  },
  {
   "id": "Hostname",
   "value": "fluidnc"
  },
  {
   "id": "Current WiFi Mode",
   "value": "STA (E0:5A:1B:E4:0E:84)"
  },
  {
   "id": "Connected to",
   "value": "BlackWidow"
  },
  {
   "id": "Signal",
   "value": "100%"
  },
  {
   "id": "Phy Mode",
   "value": "11n"
  },
  {
   "id": "Channel",
   "value": "2"
  },
  {
   "id": "IP Mode",
   "value": "DHCP"
  },
  {
   "id": "IP",
   "value": "192.168.100.98"
  },
  {
   "id": "Gateway",
   "value": "192.168.100.1"
  },
  {
   "id": "Mask",
   "value": "255.255.252.0"
  },
  {
   "id": "DNS",
   "value": "192.168.100.89"
  },
  {
   "id": "Disabled Mode",
   "value": "AP (E0:5A:1B:E4:0E:85)"
  },
  {
   "id": "FW version",
   "value": "FluidNC v3.9.9"
  }
 ]
})
        return
    }
    if (url.indexOf("701") != -1) {
        if (url.indexOf("json") != -1) {
            res.json({
                cmd: "701",
                status: "ok",
                data: {
                    status: "processing",
                    total: "1000",
                    processed: "100",
                    type: "SD",
                    name: "test.gcode",
                    code: 3,
                },
            })
            /*res.json({
                cmd: "701",
                status: "ok",
                data: "no stream",
            })*/
        } else {
            res.send("no stream\n")
        }
        return
    }
    if (url.indexOf("ESP410") != -1) {
        res.json({
            cmd: "410",
            status: "ok",
            data: [{ SSID: "luc-ext1", SIGNAL: "52", IS_PROTECTED: "1" }],
        })
        return
    }

    if (url.indexOf("$G") != -1) {
        change = !change
        //SendWS("[GC:G0 G54 G17 G21 G90 G94 M5 M9 T0 F0.0 S0]\n")
        if (change) {
            SendWS(
                "[GC:G0 G54 G17 G21 G90 G92 G94 G49 G98 G51:5 M5 M6 M9 T0 F0 S0.]\n"
            )
        } else {
            SendWS("[GC:G0 G54 G17 G21 G90 G94 G49 G98 M56 M5 M9 T0 F0 S0.]\n")
        }

        res.send("")
        return
    }

    if (url.indexOf("$I") != -1) {
        SendWS("[VER:1.1f.20170801:]\n" + "[OPT:VZHTL,15,128]\n")
        res.send("")
        return
    }

    if (url.indexOf("\x18") != -1) {
        SendWS("Grbl 1.1f ['$' for help]\n")
        res.send("")
        return
    }

    if (url.indexOf("$#") != -1) {
        SendWS(
            "[G54:4.000,0.000,0.000]\n" +
                "[G55:4.000,6.000,7.000]\n" +
                "[G56:0.000,0.000,0.000]\n" +
                "[G57:0.000,0.000,0.000]\n" +
                "[G58:0.000,0.000,0.000]\n" +
                "[G59:0.000,0.000,0.000]\n" +
                "[G28:1.000,2.000,0.000]\n" +
                "[G30:4.000,6.000,0.000]\n" +
                "[G92:0.000,0.000,0.000]\n" +
                "[TLO:0.000]\n" +
                "[PRB:0.000,0.000,0.000:1]\n"
        )
        res.send("")
        return
    }

    if (url.indexOf("$$") != -1) {
        SendWS(
            "$0=3\n" +
                "$1=250\n" +
                "$2=0\n" +
                "$3=0\n" +
                "$4=0\n" +
                "$5=1\n" +
                "$6=0\n" +
                "$10=1\n" +
                "$11=0.010\n" +
                "$12=0.002\n" +
                "$13=0\n" +
                "$20=0\n" +
                "$21=0\n" +
                "$22=0\n" +
                "$23=3\n" +
                "$24=200.000\n" +
                "$25=2000.000\n" +
                "$26=250\n" +
                "$27=1.000\n" +
                "$30=1000.000\n" +
                "$31=0.000\n" +
                "$32=0\n" +
                "$100=100.000\n" +
                "$101=100.000\n" +
                "$102=100.000\n" +
                "$103=100.000\n" +
                "$104=100.000\n" +
                "$105=100.000\n" +
                "$110=1000.000\n" +
                "$111=1000.000\n" +
                "$112=1000.000\n" +
                "$113=1000.000\n" +
                "$114=1000.000\n" +
                "$115=1000.000\n" +
                "$120=200.000\n" +
                "$121=200.000\n" +
                "$122=200.000\n" +
                "$123=200.000\n" +
                "$124=200.000\n" +
                "$125=200.000\n" +
                "$130=300.000\n" +
                "$131=300.000\n" +
                "$132=300.000\n" +
                "$133=300.000\n" +
                "$134=300.000\n" +
                "$135=300.000\n" +
                "ok\n"
        )
        res.send("")
        return
    }

    if (url.indexOf("ESP600") != -1) {
        const text = url.substring(8)
        SendWS(text, false)
        res.send("")
        return
    }

    /* grblHAL without emulation*/
    if (url.indexOf("ESP400") != -1 && !emulationESP400) {
        res.json({cmd:"400",
  status:"ok",
  data:[
    {F:"Flash/Settings",
      P:"Notification/Type",
      H:"Notification/Type",
      T:"B",
      "V":"0",
      "O":[
        {"EMAIL":"2"
        },
        {"LINE":"3"
        },
        {"NONE":"0"
        },
        {"PUSHOVER":"1"
        },
        {"TG":"4"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"Notification/T1",
      "H":"Notification/T1",
      "T":"S",
      "V":"",
      "S":"63",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"Notification/T2",
      "H":"Notification/T2",
      "T":"S",
      "V":"",
      "S":"63",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"Notification/TS",
      "H":"Notification/TS",
      "T":"S",
      "V":"",
      "S":"127",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"Telnet/Enable",
      "H":"Telnet/Enable",
      "T":"B",
      "V":"1",
      "O":[
        {"OFF":"0"
        },
        {"ON":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"Telnet/Port",
      "H":"Telnet/Port",
      "T":"I",
      "V":"23",
      "S":"65001",
      "M":"1"
    },
    {"F":"Flash/Settings",
      "P":"HTTP/BlockDuringMotion",
      "H":"HTTP/BlockDuringMotion",
      "T":"B",
      "V":"1",
      "O":[
        {"OFF":"0"
        },
        {"ON":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"HTTP/Enable",
      "H":"HTTP/Enable",
      "T":"B",
      "V":"1",
      "O":[
        {"OFF":"0"
        },
        {"ON":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"HTTP/Port",
      "H":"HTTP/Port",
      "T":"I",
      "V":"80",
      "S":"65001",
      "M":"1"
    },
    {"F":"Flash/Settings",
      "P":"MDNS/Enable",
      "H":"MDNS/Enable",
      "T":"B",
      "V":"1",
      "O":[
        {"OFF":"0"
        },
        {"ON":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"WiFi/PsMode",
      "H":"WiFi/PsMode",
      "T":"B",
      "V":"0",
      "O":[
        {"Max":"2"
        },
        {"Min":"1"
        },
        {"None":"0"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"WiFi/Mode",
      "H":"WiFi/Mode",
      "T":"B",
      "V":"3",
      "O":[
        {"AP":"2"
        },
        {"Off":"0"
        },
        {"STA":"1"
        },
        {"STA>AP":"3"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"Sta/Password",
      "H":"Sta/Password",
      "T":"S",
      "V":"********",
      "S":"64",
      "M":"8"
    },
    {"F":"Flash/Settings",
      "P":"Sta/MinSecurity",
      "H":"Sta/MinSecurity",
      "T":"B",
      "V":"3",
      "O":[
        {"OPEN":"0"
        },
        {"WAPI-PSK":"8"
        },
        {"WEP":"1"
        },
        {"WPA-PSK":"2"
        },
        {"WPA-WPA2-PSK":"4"
        },
        {"WPA2-ENTERPRISE":"5"
        },
        {"WPA2-PSK":"3"
        },
        {"WPA2-WPA3-PSK":"7"
        },
        {"WPA3-ENT-192":"9"
        },
        {"WPA3-PSK":"6"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"WiFi/FastScan",
      "H":"WiFi/FastScan",
      "T":"B",
      "V":"0",
      "O":[
        {"OFF":"0"
        },
        {"ON":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"Sta/IPMode",
      "H":"Sta/IPMode",
      "T":"B",
      "V":"0",
      "O":[
        {"DHCP":"0"
        },
        {"Static":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"Sta/IP",
      "H":"Sta/IP",
      "T":"A",
      "V":"0.0.0.0"
    },
    {"F":"Flash/Settings",
      "P":"Sta/Gateway",
      "H":"Sta/Gateway",
      "T":"A",
      "V":"0.0.0.0"
    },
    {"F":"Flash/Settings",
      "P":"Sta/Netmask",
      "H":"Sta/Netmask",
      "T":"A",
      "V":"0.0.0.0"
    },
    {"F":"Flash/Settings",
      "P":"AP/Country",
      "H":"AP/Country",
      "T":"B",
      "V":"0",
      "O":[
        {"01":"0"
        },
        {"AT":"1"
        },
        {"AU":"2"
        },
        {"BE":"3"
        },
        {"BG":"4"
        },
        {"BR":"5"
        },
        {"CA":"6"
        },
        {"CH":"7"
        },
        {"CN":"8"
        },
        {"CY":"9"
        },
        {"CZ":"10"
        },
        {"DE":"11"
        },
        {"DK":"12"
        },
        {"EE":"13"
        },
        {"ES":"14"
        },
        {"FI":"15"
        },
        {"FR":"16"
        },
        {"GB":"17"
        },
        {"GR":"18"
        },
        {"HK":"19"
        },
        {"HR":"20"
        },
        {"HU":"21"
        },
        {"IE":"22"
        },
        {"IN":"23"
        },
        {"IS":"24"
        },
        {"IT":"25"
        },
        {"JP":"26"
        },
        {"KR":"27"
        },
        {"LI":"28"
        },
        {"LT":"29"
        },
        {"LU":"30"
        },
        {"LV":"31"
        },
        {"MT":"32"
        },
        {"MX":"33"
        },
        {"NL":"34"
        },
        {"NO":"35"
        },
        {"NZ":"36"
        },
        {"PL":"37"
        },
        {"PT":"38"
        },
        {"RO":"39"
        },
        {"SE":"40"
        },
        {"SI":"41"
        },
        {"SK":"42"
        },
        {"TW":"43"
        },
        {"US":"44"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"AP/SSID",
      "H":"AP/SSID",
      "T":"S",
      "V":"FluidNC",
      "S":"32",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"AP/Password",
      "H":"AP/Password",
      "T":"S",
      "V":"********",
      "S":"64",
      "M":"8"
    },
    {"F":"Flash/Settings",
      "P":"AP/IP",
      "H":"AP/IP",
      "T":"A",
      "V":"192.168.0.1"
    },
    {"F":"Flash/Settings",
      "P":"AP/Channel",
      "H":"AP/Channel",
      "T":"I",
      "V":"1",
      "S":"14",
      "M":"1"
    },
    {"F":"Flash/Settings",
      "P":"Hostname",
      "H":"Hostname",
      "T":"S",
      "V":"fluidnc",
      "S":"32",
      "M":"1"
    },
    {"F":"Flash/Settings",
      "P":"Sta/SSID",
      "H":"Sta/SSID",
      "T":"S",
      "V":"BlackWidow",
      "S":"32",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"GCode/Echo",
      "H":"GCode/Echo",
      "T":"B",
      "V":"0",
      "O":[
        {"OFF":"0"
        },
        {"ON":"1"
        }
      ]
    },
    {"F":"Flash/Settings",
      "P":"Start/Message",
      "H":"Start/Message",
      "T":"S",
      "V":"Grbl \\V [FluidNC \\B (\\R) \\H]",
      "S":"40",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"Firmware/Build",
      "H":"Firmware/Build",
      "T":"S",
      "V":"",
      "S":"20",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"SD/FallbackCS",
      "H":"SD/FallbackCS",
      "T":"I",
      "V":"-1",
      "S":"40",
      "M":"-1"
    },
    {"F":"Flash/Settings",
      "P":"Report/Status",
      "H":"Report/Status",
      "T":"I",
      "V":"1",
      "S":"3",
      "M":"0"
    },
    {"F":"Flash/Settings",
      "P":"Config/Filename",
      "H":"Config/Filename",
      "T":"S",
      "V":"config.yaml",
      "S":"50",
      "M":"1"
    },
    {"F":"Flash/Settings",
      "P":"Message/Level",
      "H":"Message/Level",
      "T":"B",
      "V":"4",
      "O":[
        {"Debug":"4"
        },
        {"Error":"1"
        },
        {"Info":"3"
        },
        {"None":"0"
        },
        {"Verbose":"5"
        },
        {"Warning":"2"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/board",
      "H":"/board",
      "T":"S",
      "V":"None",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/name",
      "H":"/name",
      "T":"S",
      "V":"Default (Test Drive no I/O)",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/meta",
      "H":"/meta",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/stepping/engine",
      "H":"/stepping/engine",
      "T":"B",
      "V":"1",
      "O":[
        {"Timed":"0"
        },
        {"RMT":"1"
        },
        {"I2S_STATIC":"2"
        },
        {"I2S_STREAM":"3"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/stepping/idle_ms",
      "H":"/stepping/idle_ms",
      "T":"I",
      "V":"255",
      "S":"10000000",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/stepping/pulse_us",
      "H":"/stepping/pulse_us",
      "T":"I",
      "V":"4",
      "S":"30",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/stepping/dir_delay_us",
      "H":"/stepping/dir_delay_us",
      "T":"I",
      "V":"0",
      "S":"10",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/stepping/disable_delay_us",
      "H":"/stepping/disable_delay_us",
      "T":"I",
      "V":"0",
      "S":"1000000",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/stepping/segments",
      "H":"/stepping/segments",
      "T":"I",
      "V":"12",
      "S":"20",
      "M":"6"
    },
    {"F":"Running/Config",
      "P":"/sdcard/frequency_hz",
      "H":"/sdcard/frequency_hz",
      "T":"I",
      "V":"8000000",
      "S":"20000000",
      "M":"400000"
    },
    {"F":"Running/Config",
      "P":"/axes/homing_runs",
      "H":"/axes/homing_runs",
      "T":"I",
      "V":"2",
      "S":"5",
      "M":"1"
    },
    {"F":"Running/Config",
      "P":"/axes/x/steps_per_mm",
      "H":"/axes/x/steps_per_mm",
      "T":"R",
      "V":"80.000"
    },
    {"F":"Running/Config",
      "P":"/axes/x/max_rate_mm_per_min",
      "H":"/axes/x/max_rate_mm_per_min",
      "T":"R",
      "V":"1000.000"
    },
    {"F":"Running/Config",
      "P":"/axes/x/acceleration_mm_per_sec2",
      "H":"/axes/x/acceleration_mm_per_sec2",
      "T":"R",
      "V":"25.000"
    },
    {"F":"Running/Config",
      "P":"/axes/x/max_travel_mm",
      "H":"/axes/x/max_travel_mm",
      "T":"R",
      "V":"1000.000"
    },
    {"F":"Running/Config",
      "P":"/axes/x/soft_limits",
      "H":"/axes/x/soft_limits",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/axes/x/motor0/hard_limits",
      "H":"/axes/x/motor0/hard_limits",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/axes/x/motor0/pulloff_mm",
      "H":"/axes/x/motor0/pulloff_mm",
      "T":"R",
      "V":"1.000"
    },
    {"F":"Running/Config",
      "P":"/axes/y/steps_per_mm",
      "H":"/axes/y/steps_per_mm",
      "T":"R",
      "V":"80.000"
    },
    {"F":"Running/Config",
      "P":"/axes/y/max_rate_mm_per_min",
      "H":"/axes/y/max_rate_mm_per_min",
      "T":"R",
      "V":"1000.000"
    },
    {"F":"Running/Config",
      "P":"/axes/y/acceleration_mm_per_sec2",
      "H":"/axes/y/acceleration_mm_per_sec2",
      "T":"R",
      "V":"25.000"
    },
    {"F":"Running/Config",
      "P":"/axes/y/max_travel_mm",
      "H":"/axes/y/max_travel_mm",
      "T":"R",
      "V":"1000.000"
    },
    {"F":"Running/Config",
      "P":"/axes/y/soft_limits",
      "H":"/axes/y/soft_limits",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/axes/y/motor0/hard_limits",
      "H":"/axes/y/motor0/hard_limits",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/axes/y/motor0/pulloff_mm",
      "H":"/axes/y/motor0/pulloff_mm",
      "T":"R",
      "V":"1.000"
    },
    {"F":"Running/Config",
      "P":"/axes/z/steps_per_mm",
      "H":"/axes/z/steps_per_mm",
      "T":"R",
      "V":"80.000"
    },
    {"F":"Running/Config",
      "P":"/axes/z/max_rate_mm_per_min",
      "H":"/axes/z/max_rate_mm_per_min",
      "T":"R",
      "V":"1000.000"
    },
    {"F":"Running/Config",
      "P":"/axes/z/acceleration_mm_per_sec2",
      "H":"/axes/z/acceleration_mm_per_sec2",
      "T":"R",
      "V":"25.000"
    },
    {"F":"Running/Config",
      "P":"/axes/z/max_travel_mm",
      "H":"/axes/z/max_travel_mm",
      "T":"R",
      "V":"1000.000"
    },
    {"F":"Running/Config",
      "P":"/axes/z/soft_limits",
      "H":"/axes/z/soft_limits",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/axes/z/motor0/hard_limits",
      "H":"/axes/z/motor0/hard_limits",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/axes/z/motor0/pulloff_mm",
      "H":"/axes/z/motor0/pulloff_mm",
      "T":"R",
      "V":"1.000"
    },
    {"F":"Running/Config",
      "P":"/coolant/delay_ms",
      "H":"/coolant/delay_ms",
      "T":"I",
      "V":"0",
      "S":"10000",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/probe/check_mode_start",
      "H":"/probe/check_mode_start",
      "T":"B",
      "V":"1",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/probe/hard_stop",
      "H":"/probe/hard_stop",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/probe/probe_hard_limit",
      "H":"/probe/probe_hard_limit",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/macros/startup_line0",
      "H":"/macros/startup_line0",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/startup_line1",
      "H":"/macros/startup_line1",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/Macro0",
      "H":"/macros/Macro0",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/Macro1",
      "H":"/macros/Macro1",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/Macro2",
      "H":"/macros/Macro2",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/Macro3",
      "H":"/macros/Macro3",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/after_homing",
      "H":"/macros/after_homing",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/after_reset",
      "H":"/macros/after_reset",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/macros/after_unlock",
      "H":"/macros/after_unlock",
      "T":"S",
      "V":"",
      "S":"255",
      "M":"0"
    },
    {"F":"Running/Config",
      "P":"/start/must_home",
      "H":"/start/must_home",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/start/deactivate_parking",
      "H":"/start/deactivate_parking",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/start/check_limits",
      "H":"/start/check_limits",
      "T":"B",
      "V":"1",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/parking/enable",
      "H":"/parking/enable",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/parking/axis",
      "H":"/parking/axis",
      "T":"B",
      "V":"2",
      "O":[
        {"X":"0"
        },
        {"Y":"1"
        },
        {"Z":"2"
        },
        {"A":"3"
        },
        {"B":"4"
        },
        {"C":"5"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/parking/target_mpos_mm",
      "H":"/parking/target_mpos_mm",
      "T":"R",
      "V":"-5.000"
    },
    {"F":"Running/Config",
      "P":"/parking/rate_mm_per_min",
      "H":"/parking/rate_mm_per_min",
      "T":"R",
      "V":"800.000"
    },
    {"F":"Running/Config",
      "P":"/parking/pullout_distance_mm",
      "H":"/parking/pullout_distance_mm",
      "T":"R",
      "V":"5.000"
    },
    {"F":"Running/Config",
      "P":"/parking/pullout_rate_mm_per_min",
      "H":"/parking/pullout_rate_mm_per_min",
      "T":"R",
      "V":"250.000"
    },
    {"F":"Running/Config",
      "P":"/user_outputs/analog0_hz",
      "H":"/user_outputs/analog0_hz",
      "T":"I",
      "V":"5000",
      "S":"20000000",
      "M":"1"
    },
    {"F":"Running/Config",
      "P":"/user_outputs/analog1_hz",
      "H":"/user_outputs/analog1_hz",
      "T":"I",
      "V":"5000",
      "S":"20000000",
      "M":"1"
    },
    {"F":"Running/Config",
      "P":"/user_outputs/analog2_hz",
      "H":"/user_outputs/analog2_hz",
      "T":"I",
      "V":"5000",
      "S":"20000000",
      "M":"1"
    },
    {"F":"Running/Config",
      "P":"/user_outputs/analog3_hz",
      "H":"/user_outputs/analog3_hz",
      "T":"I",
      "V":"5000",
      "S":"20000000",
      "M":"1"
    },
    {"F":"Running/Config",
      "P":"/arc_tolerance_mm",
      "H":"/arc_tolerance_mm",
      "T":"R",
      "V":"0.002"
    },
    {"F":"Running/Config",
      "P":"/junction_deviation_mm",
      "H":"/junction_deviation_mm",
      "T":"R",
      "V":"0.010"
    },
    {"F":"Running/Config",
      "P":"/verbose_errors",
      "H":"/verbose_errors",
      "T":"B",
      "V":"1",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/report_inches",
      "H":"/report_inches",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/enable_parking_override_control",
      "H":"/enable_parking_override_control",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/use_line_numbers",
      "H":"/use_line_numbers",
      "T":"B",
      "V":"0",
      "O":[
        {"False":"0"
        },
        {"True":"1"
        }
      ]
    },
    {"F":"Running/Config",
      "P":"/planner_blocks",
      "H":"/planner_blocks",
      "T":"I",
      "V":"16",
      "S":"120",
      "M":"10"
    }
  ]
        })

        return
    }

    /* grblHAL with emulation
    if (url.indexOf("ESP400") != -1 && emulationESP400) {
        res.json({
            cmd: "400",
            status: "ok",
            data: [
                {
                    F: "Stepper/Stepper",
                    P: "0",
                    T: "F",
                    V: "10.0",
                    H: "Step pulse time",
                    M: "2.0",
                },
                {
                    F: "Stepper/Stepper",
                    P: "1",
                    T: "I",
                    V: "25",
                    H: "Step idle delay",
                    S: "65535",
                },
                {
                    F: "Step pulse invert/Stepper",
                    P: "2#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Step pulse invert/Stepper",
                    P: "2#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Step pulse invert/Stepper",
                    P: "2#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Step direction invert/Stepper",
                    P: "3#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Step direction invert/Stepper",
                    P: "3#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Step direction invert/Stepper",
                    P: "3#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert stepper enable pin(s)/Stepper",
                    P: "4#0",
                    T: "B",
                    V: "1",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert stepper enable pin(s)/Stepper",
                    P: "4#1",
                    T: "B",
                    V: "1",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert stepper enable pin(s)/Stepper",
                    P: "4#2",
                    T: "B",
                    V: "1",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert limit pins/Limits",
                    P: "5#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert limit pins/Limits",
                    P: "5#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert limit pins/Limits",
                    P: "5#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Probing/Probing",
                    P: "6#0",
                    T: "B",
                    V: "0",
                    H: "Invert probe pin",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Spindle/Spindle",
                    P: "9",
                    T: "X",
                    V: "1",
                    H: "PWM Spindle",
                    O: [
                        {
                            Enable: "0",
                        },
                        {
                            "RPM controls spindle enable signal": "1",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#0",
                    T: "B",
                    V: "1",
                    H: "Position in machine coordinate",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#1",
                    T: "B",
                    V: "1",
                    H: "Buffer state",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#2",
                    T: "B",
                    V: "1",
                    H: "Line numbers",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#3",
                    T: "B",
                    V: "1",
                    H: "Feed & speed",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#4",
                    T: "B",
                    V: "1",
                    H: "Pin state",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#5",
                    T: "B",
                    V: "1",
                    H: "Work coordinate offset",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#6",
                    T: "B",
                    V: "1",
                    H: "Overrides",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#7",
                    T: "B",
                    V: "1",
                    H: "Probe coordinates",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#8",
                    T: "B",
                    V: "1",
                    H: "Buffer sync on WCO change",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#9",
                    T: "B",
                    V: "0",
                    H: "Parser state",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#10",
                    T: "B",
                    V: "0",
                    H: "Alarm substatus",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Status report options/General",
                    P: "10#11",
                    T: "B",
                    V: "0",
                    H: "Run substatus",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "General/General",
                    P: "11",
                    T: "F",
                    V: "0.010",
                    H: "Junction deviation",
                },
                {
                    F: "General/General",
                    P: "12",
                    T: "F",
                    V: "0.002",
                    H: "Arc tolerance",
                },
                {
                    F: "General/General",
                    P: "13#0",
                    T: "B",
                    V: "0",
                    H: "Report in inches",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Invert control pins/Control signals",
                    P: "14#0",
                    T: "B",
                    V: "0",
                    H: "Reset",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert control pins/Control signals",
                    P: "14#1",
                    T: "B",
                    V: "0",
                    H: "Feed hold",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert control pins/Control signals",
                    P: "14#2",
                    T: "B",
                    V: "0",
                    H: "Cycle start",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert coolant pins/Coolant",
                    P: "15#0",
                    T: "B",
                    V: "0",
                    H: "Flood",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert coolant pins/Coolant",
                    P: "15#1",
                    T: "B",
                    V: "0",
                    H: "Mist",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert spindle signals/Spindle",
                    P: "16#0",
                    T: "B",
                    V: "0",
                    H: "Spindle enable",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Invert spindle signals/Spindle",
                    P: "16#2",
                    T: "B",
                    V: "0",
                    H: "PWM",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Pullup disable control pins/Control signals",
                    P: "17#0",
                    T: "B",
                    V: "0",
                    H: "Reset",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Pullup disable control pins/Control signals",
                    P: "17#1",
                    T: "B",
                    V: "0",
                    H: "Feed hold",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Pullup disable control pins/Control signals",
                    P: "17#2",
                    T: "B",
                    V: "0",
                    H: "Cycle start",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Pullup disable limit pins/Limits",
                    P: "18#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Pullup disable limit pins/Limits",
                    P: "18#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Pullup disable limit pins/Limits",
                    P: "18#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Probing/Probing",
                    P: "19#0",
                    T: "B",
                    V: "0",
                    H: "Pullup disable probe pin",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Limits/Limits",
                    P: "20#0",
                    T: "B",
                    V: "0",
                    H: "Soft limits enable",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Limits/Limits",
                    P: "21",
                    T: "X",
                    V: "0",
                    H: "Hard limits enable",
                    O: [
                        {
                            Enable: "0",
                        },
                        {
                            "Strict mode": "1",
                        },
                    ],
                },
                {
                    F: "Homing/Homing",
                    P: "22",
                    T: "X",
                    V: "0",
                    H: "Homing cycle",
                    O: [
                        {
                            Enable: "0",
                        },
                        {
                            "Enable single axis commands": "1",
                        },
                        {
                            "Homing on startup required": "2",
                        },
                        {
                            "Set machine origin to 0": "3",
                        },
                        {
                            "Two switches shares one input pin": "4",
                        },
                        {
                            "Allow manual": "5",
                        },
                        {
                            "Override locks": "6",
                        },
                        {
                            "Keep homed status on reset": "7",
                        },
                    ],
                },
                {
                    F: "Homing direction invert/Homing",
                    P: "23#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Homing direction invert/Homing",
                    P: "23#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Homing direction invert/Homing",
                    P: "23#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Homing/Homing",
                    P: "24",
                    T: "F",
                    V: "25.0",
                    H: "Homing locate feed rate",
                },
                {
                    F: "Homing/Homing",
                    P: "25",
                    T: "F",
                    V: "500.0",
                    H: "Homing search seek rate",
                },
                {
                    F: "Homing/Homing",
                    P: "26",
                    T: "I",
                    V: "250",
                    H: "Homing switch debounce delay",
                },
                {
                    F: "Homing/Homing",
                    P: "27",
                    T: "F",
                    V: "1.000",
                    H: "Homing switch pull-off distance",
                },
                {
                    F: "General/General",
                    P: "28",
                    T: "F",
                    V: "0.100",
                    H: "G73 Retract distance",
                },
                {
                    F: "Stepper/Stepper",
                    P: "29",
                    T: "F",
                    V: "0.0",
                    H: "Pulse delay",
                    S: "10",
                },
                {
                    F: "Spindle/Spindle",
                    P: "30",
                    T: "F",
                    V: "1000.000",
                    H: "Maximum spindle speed",
                },
                {
                    F: "Spindle/Spindle",
                    P: "31",
                    T: "F",
                    V: "0.000",
                    H: "Minimum spindle speed",
                },
                {
                    F: "General/General",
                    P: "32",
                    T: "B",
                    V: "0",
                    H: "Mode of operation",
                    O: [
                        {
                            Normal: "0",
                        },
                        {
                            "Laser mode": "1",
                        },
                        {
                            "Lathe mode": "2",
                        },
                    ],
                },
                {
                    F: "Spindle/Spindle",
                    P: "33",
                    T: "F",
                    V: "5000.0",
                    H: "Spindle PWM frequency",
                },
                {
                    F: "Spindle/Spindle",
                    P: "34",
                    T: "F",
                    V: "0.0",
                    H: "Spindle PWM off value",
                    S: "100",
                },
                {
                    F: "Spindle/Spindle",
                    P: "35",
                    T: "F",
                    V: "0.0",
                    H: "Spindle PWM min value",
                    S: "100",
                },
                {
                    F: "Spindle/Spindle",
                    P: "36",
                    T: "F",
                    V: "100.0",
                    H: "Spindle PWM max value",
                    S: "100",
                },
                {
                    F: "Steppers deenergize/Stepper",
                    P: "37#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Steppers deenergize/Stepper",
                    P: "37#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Steppers deenergize/Stepper",
                    P: "37#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "General/General",
                    P: "39#0",
                    T: "B",
                    V: "1",
                    H: "Enable legacy RT commands",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Jogging/Jogging",
                    P: "40#0",
                    T: "B",
                    V: "0",
                    H: "Limit jog commands",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Homing/Homing",
                    P: "43",
                    T: "I",
                    V: "1",
                    H: "Homing passes",
                    M: "1",
                    S: "128",
                },
                {
                    F: "Axes homing, first pass/Homing",
                    P: "44#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, first pass/Homing",
                    P: "44#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, first pass/Homing",
                    P: "44#2",
                    T: "B",
                    V: "1",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, second pass/Homing",
                    P: "45#0",
                    T: "B",
                    V: "1",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, second pass/Homing",
                    P: "45#1",
                    T: "B",
                    V: "1",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, second pass/Homing",
                    P: "45#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, third pass/Homing",
                    P: "46#0",
                    T: "B",
                    V: "0",
                    H: "X",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, third pass/Homing",
                    P: "46#1",
                    T: "B",
                    V: "0",
                    H: "Y",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Axes homing, third pass/Homing",
                    P: "46#2",
                    T: "B",
                    V: "0",
                    H: "Z",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "General/General",
                    P: "62#0",
                    T: "B",
                    V: "0",
                    H: "Sleep enable",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Feed hold actions/General",
                    P: "63#0",
                    T: "B",
                    V: "0",
                    H: "Disable laser during hold",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Feed hold actions/General",
                    P: "63#1",
                    T: "B",
                    V: "1",
                    H: "Restore spindle and coolant state on resume",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "General/General",
                    P: "64#0",
                    T: "B",
                    V: "0",
                    H: "Force init alarm",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Probing/Probing",
                    P: "65#0",
                    T: "B",
                    V: "0",
                    H: "Probing feed override",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "X-axis/X-axis",
                    P: "100",
                    T: "F",
                    V: "250.000",
                    H: "axis travel resolution",
                },
                {
                    F: "Y-axis/Y-axis",
                    P: "100",
                    T: "F",
                    V: "250.000",
                    H: "axis travel resolution",
                },
                {
                    F: "Z-axis/Z-axis",
                    P: "100",
                    T: "F",
                    V: "250.000",
                    H: "axis travel resolution",
                },
                {
                    F: "X-axis/X-axis",
                    P: "110",
                    T: "F",
                    V: "500.000",
                    H: "axis maximum rate",
                },
                {
                    F: "Y-axis/Y-axis",
                    P: "110",
                    T: "F",
                    V: "500.000",
                    H: "axis maximum rate",
                },
                {
                    F: "Z-axis/Z-axis",
                    P: "110",
                    T: "F",
                    V: "500.000",
                    H: "axis maximum rate",
                },
                {
                    F: "X-axis/X-axis",
                    P: "120",
                    T: "F",
                    V: "10.000",
                    H: "axis acceleration",
                },
                {
                    F: "Y-axis/Y-axis",
                    P: "120",
                    T: "F",
                    V: "10.000",
                    H: "axis acceleration",
                },
                {
                    F: "Z-axis/Z-axis",
                    P: "120",
                    T: "F",
                    V: "10.000",
                    H: "axis acceleration",
                },
                {
                    F: "X-axis/X-axis",
                    P: "130",
                    T: "F",
                    V: "200.000",
                    H: "axis maximum travel",
                },
                {
                    F: "Y-axis/Y-axis",
                    P: "130",
                    T: "F",
                    V: "200.000",
                    H: "axis maximum travel",
                },
                {
                    F: "Z-axis/Z-axis",
                    P: "130",
                    T: "F",
                    V: "200.000",
                    H: "axis maximum travel",
                },
                {
                    F: "Tool change/Tool change",
                    P: "341",
                    T: "B",
                    V: "0",
                    H: "Tool change mode",
                    O: [
                        {
                            Normal: "0",
                        },
                        {
                            "Manual touch off": "1",
                        },
                        {
                            "Manual touch off @ G59.3": "2",
                        },
                        {
                            "Automatic touch off @ G59.3": "3",
                        },
                        {
                            "Ignore M6": "4",
                        },
                    ],
                },
                {
                    F: "Tool change/Tool change",
                    P: "342",
                    T: "F",
                    V: "30.0",
                    H: "Tool change probing distance",
                },
                {
                    F: "Tool change/Tool change",
                    P: "343",
                    T: "F",
                    V: "25.0",
                    H: "Tool change locate feed rate",
                },
                {
                    F: "Tool change/Tool change",
                    P: "344",
                    T: "F",
                    V: "200.0",
                    H: "Tool change search seek rate",
                },
                {
                    F: "Tool change/Tool change",
                    P: "345",
                    T: "F",
                    V: "100.0",
                    H: "Tool change probe pull-off rate",
                },
                {
                    F: "General/General",
                    P: "384#0",
                    T: "B",
                    V: "0",
                    H: "Disable G92 persistence",
                    O: [
                        {
                            Enabled: "1",
                        },
                        {
                            Disabled: "0",
                        },
                    ],
                },
                {
                    F: "Network Services/Networking",
                    P: "70#0",
                    T: "B",
                    V: "1",
                    H: "Telnet",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Network Services/Networking",
                    P: "70#1",
                    T: "B",
                    V: "1",
                    H: "Websocket",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "Network Services/Networking",
                    P: "70#2",
                    T: "B",
                    V: "1",
                    H: "HTTP",
                    O: [
                        {
                            On: "1",
                        },
                        {
                            Off: "0",
                        },
                    ],
                },
                {
                    F: "WiFi/WiFi",
                    P: "74",
                    T: "S",
                    V: "",
                    H: "WiFi Station (STA) SSID",
                    S: "64",
                },
                {
                    F: "WiFi/WiFi",
                    P: "75",
                    T: "S",
                    V: "********",
                    H: "WiFi Station (STA) Password",
                    S: "32",
                },
                {
                    F: "Networking/Networking",
                    P: "300",
                    T: "S",
                    V: "Grbl",
                    H: "Hostname",
                    S: "64",
                },
                {
                    F: "Networking/Networking",
                    P: "302",
                    T: "A",
                    V: "192.168.5.1",
                    H: "IP Address",
                },
                {
                    F: "Networking/Networking",
                    P: "303",
                    T: "A",
                    V: "192.168.5.1",
                    H: "Gateway",
                },
                {
                    F: "Networking/Networking",
                    P: "304",
                    T: "A",
                    V: "255.255.255.0",
                    H: "Netmask",
                },
                {
                    F: "WiFi/WiFi",
                    P: "73",
                    T: "B",
                    V: "2",
                    H: "WiFi Mode",
                    O: [
                        {
                            Off: "0",
                        },
                        {
                            Station: "1",
                        },
                        {
                            "Access Point": "2",
                        },
                        {
                            "Access Point/Station": "3",
                        },
                    ],
                },
                {
                    F: "WiFi/WiFi",
                    P: "76",
                    T: "S",
                    V: "GRBL",
                    H: "WiFi Access Point (AP) SSID",
                    S: "64",
                },
                {
                    F: "WiFi/WiFi",
                    P: "77",
                    T: "S",
                    V: "********",
                    H: "WiFi Access Point (AP) Password",
                    S: "32",
                },
                {
                    F: "Networking/Networking",
                    P: "310",
                    T: "S",
                    V: "GrblAP",
                    H: "Hostname (AP)",
                    S: "64",
                },
                {
                    F: "Networking/Networking",
                    P: "312",
                    T: "A",
                    V: "192.168.5.1",
                    H: "IP Address (AP)",
                },
                {
                    F: "Networking/Networking",
                    P: "313",
                    T: "A",
                    V: "192.168.5.1",
                    H: "Gateway (AP)",
                },
                {
                    F: "Networking/Networking",
                    P: "314",
                    T: "A",
                    V: "255.255.255.0",
                    H: "Netmask (AP)",
                },
                {
                    F: "Networking/Networking",
                    P: "305",
                    T: "I",
                    V: "23",
                    H: "Telnet port",
                    M: "1",
                    S: "65535",
                },
                {
                    F: "Networking/Networking",
                    P: "306",
                    T: "I",
                    V: "80",
                    H: "HTTP port",
                    M: "1",
                    S: "65535",
                },
                {
                    F: "Networking/Networking",
                    P: "307",
                    T: "I",
                    V: "81",
                    H: "Websocket port",
                    M: "1",
                    S: "65535",
                },
            ],
        })
        return
    }*/
    SendWS("ok\n")
    res.send("")
}

const configURI = (req, res) => {
    lastconnection = Date.now()
    res.send(
        "chip id: 56398\nCPU Freq: 240 Mhz<br/>" +
            "CPU Temp: 58.3 C<br/>" +
            "free mem: 212.36 KB<br/>" +
            "SDK: v3.2.3-14-gd3e562907<br/>" +
            "flash size: 4.00 MB<br/>" +
            "size for update: 1.87 MB<br/>" +
            "FS type: LittleFS<br/>" +
            "FS usage: 104.00 KB/192.00 KB<br/>" +
            "baud: 115200<br/>" +
            "sleep mode: none<br/>" +
            "wifi: ON<br/>" +
            "hostname: esp3d<br/>" +
            "HTTP port: 80<br/>" +
            "Telnet port: 23<br/>" +
            "WebDav port: 8383<br/>" +
            "sta: ON<br/>" +
            "mac: 80:7D:3A:C4:4E:DC<br/>" +
            "SSID: WIFI_OFFICE_A2G<br/>" +
            "signal: 100 %<br/>" +
            "phy mode: 11n<br/>" +
            "channel: 11<br/>" +
            "ip mode: dhcp<br/>" +
            "ip: 192.168.1.61<br/>" +
            "gw: 192.168.1.1<br/>" +
            "msk: 255.255.255.0<br/>" +
            "DNS: 192.168.1.1<br/>" +
            "ap: OFF<br/>" +
            "mac: 80:7D:3A:C4:4E:DD<br/>" +
            "serial: ON<br/>" +
            "notification: OFF<br/>" +
            "Target Fw: grbl<br/>" +
            "FW ver: 3.0.0.a91<br/>" +
            "FW arch: ESP32 "
    )
}

module.exports = {
    commandsQuery,
    configURI,
    getLastconnection,
}
