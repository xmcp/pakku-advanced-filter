// ==UserScript==
// @name         pakku advanced filter
// @namespace    http://s.xmcp.ml/pakkujs/
// @version      0.2.1
// @description  弹幕屏蔽Pro+ （依赖于 pakku≥8.7）
// @author       xmcp
// @match        *://*.bilibili.com/*
// @grant        none
// ==/UserScript==

// 请先安装 [pakku](http://s.xmcp.ml/pakkujs/)

const NEED_UID=true; // 是否需要使用 cracked_uid 属性（慢）
const NEED_SENDER_INFO=true; // 是否需要使用 sender_info 属性（更慢）
const SILENCE=false; // 加载用户信息时不显示进度条

function do_filter(D) {
    // 屏蔽规则写在这个函数里

    return D.filter((d) => {
        // const [time, mode, size, color, sendtime, pool, uid_hash, danmaku_id] = d.peers[0].attr;

        // 示例：仅显示 LV3 以上用户的弹幕
        return d.sender_info && d.sender_info.level_info.current_level>=3;

        /*

        d = {
            "text": "₍₂₎]][[",
            "desc": [],
            "xml_src": "<d p=\"0.00000,1,25,16777215,1524407489,0,91d6b7d0,4480700090\">₍₂₎]][[</d>",
            "peers": [
                {
                          // time,     mode, size, color,      sendtime,    pool, uid_hash,   danmaku_id
                    "attr": ["0.00000", "1", "25", "16777215", "1524407489", "0", "91d6b7d0", "4480700090"],
                    "time": 0, // === parseFloat(attr[0])
                    "orig_str": "]][[",
                    "mode": "1", // === attr[1]
                    "reason": "ORIG"
                },
                {
                    "attr": ["0.00000","1","25","16777215","1524407554","0","91d6b7d0","4480703586"],
                    "time": 0,
                    "orig_str": "]]][[[",
                    "mode": "1",
                    "reason": "≤2"
                }
            ],
            "cracked_uid": 10119345,
            "sender_info": {
                "mid": "10119345",
                "uname": "xmcp",
                "face": "/bfs/face/902415752868028e925cf3ee508a7d6c6d4d57e3.jpg",
                "avatar": "http://i2.hdslb.com/bfs/face/902415752868028e925cf3ee508a7d6c6d4d57e3.jpg",
                "rank": "10000",
                "DisplayRank": "10000",
                "sex": "男",
                "sign": "pcmx",
                "level_info": {
                    "next_exp": 28800,
                    "current_level": 5,
                    "current_min": 10800,
                    "current_exp": 14392
                },
                "pendant": {
                    "pid": 0,
                    "name": "",
                    "image": "",
                    "expire": 0
                },
                "nameplate": {
                    "nid": 60,
                    "name": " 饭圈萌新",
                    "image": "http://i1.hdslb.com/bfs/face/51ca16136e570938450bca360f28761ceb609f33.png",
                    "image_small": "http://i2.hdslb.com/bfs/face/9abfa4769357f85937782c2dbc40fafda4f57217.png",
                    "level": "普通勋章",
                    "condition": "当前持有粉丝勋章最高等级>=5级"
                },
                "official_verify": {
                    "type": -1,
                    "desc": ""
                }
            }
        }

        */
    });
}

(function() {
    'use strict';

    // https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
    function comp_ver(ver1, ver2) {
        ver1 = ver1.split('.').map( s => s.padStart(10) ).join('.');
        ver2 = ver2.split('.').map( s => s.padStart(10) ).join('.');
        return ver1 < ver2;
    }
    function check_ver(ver) {
        if((NEED_SENDER_INFO || NEED_UID) && comp_ver(ver,'8.7'))
            alert('按发送者屏蔽弹幕需要 pakku 8.7 或更高版本');
        if(SILENCE && comp_ver(ver,'8.7.1'))
            alert('隐藏加载进度条需要 pakku 8.7.1 或更高版本');
    }

    let COMPLETED=false;

    addEventListener('message',function(e) {
        if(e.data.type==='pakku_event_danmaku_loaded') {
            if(COMPLETED) return;
            check_ver(e.data.pakku_version||'0');
            if(NEED_SENDER_INFO) {
                postMessage({type: 'pakku_get_danmaku_with_info', silence: SILENCE},'*');
            } else if(NEED_UID) {
                postMessage({type: 'pakku_get_danmaku_with_uid'},'*');
            } else {
                postMessage({type: 'pakku_get_danmaku'},'*');
            }
        } else if(e.data.type==='pakku_return_danmaku') {
            const D=do_filter(e.data.resp);
            console.log('pakku advanced filter: '+D.length+' danmakus left');
            let xml='<i>';
            D.forEach(d=>{
                xml+=d.xml_src;
            });
            xml+='</i>';
            COMPLETED=true;
            window.postMessage({type: 'pakku_set_xml_bounce', xml: xml},'*');
        }
    });
})();