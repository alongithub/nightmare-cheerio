const cheerio = require('cheerio');
const fs = require('fs');
var Nightmare = require('nightmare');      
var nightmare = Nightmare({
    show: true, //显示electron窗口
    waitTimeout: 1000 * 60 * 60, // in ms
    gotoTimeout: 1000 * 10, // in ms
});



nightmare
    //加载页面
    .goto('http://bmfw.www.gov.cn/yqfxdjcx/index.html')
    .wait(function() {
        return document.querySelectorAll(".province li").length > 0;//通过新闻列表的长度，来判断页面是否加载完成
    })
    // .inject('js','jquery.min.js')//插入jquery
    .wait(function(){
        // 判断乡镇是否是对应区县
        const cityhasblock = (city, block) => {
            const t = parseInt(city) / 100;
            const tn = t + 1;
            const b = parseInt(block);
            return b > t * 100 && b < tn * 100
        }

        if(window.list === undefined){　　　　　　　　　　　　　//定义变量
            window.list={
                citys: {},
                level2num:  $('.province li').length,
            };
            return false;
        }

        if ($('.province li')[0].className !== 'active') {
            $('.province li')[0].click();
            return false;
        } else {
            if (window.list.level3num === undefined) {
                if ($('.city li').length > 0) {
                    window.list.level3num = $('.city li').length;
                    window.list.currlevel3 = 0;
                    return false;
                }
                return false;
            } 
            const currlevel3 = window.list.currlevel3;
            if ($('.city li')[currlevel3].className === 'active') {
                // 遍历 区下的乡镇街道

                // 拿到机构的code
                const orgcode = $('.city li')[currlevel3].getAttribute('data-areacode');

                // 拿到当前乡镇列表的第一个
                const blockorgcoe = $('.block li')[0].getAttribute('data-areacode')
                // 判断乡镇接到是否加载完毕
                if ($('.block li').length > 0 && cityhasblock(orgcode, blockorgcoe)) {
                    // 如果某区县下乡镇刚加载出来
                    if (!window.list.citys[orgcode]) {
                        window.list.citys[orgcode] = {
                            length: $('.block li').length,
                            curr: 0,
                            orgname: $('.city li')[currlevel3].innerHTML,
                            list: {}
                        }
                        return false;
                    }

                    // 遍历 乡镇
                    const length = window.list.citys[orgcode].length;
                    const curr = window.list.citys[orgcode].curr;
                    const list = window.list.citys[orgcode].list;
                    if (curr >= length) {
                        window.list.currlevel3 ++;
                        if (window.list.currlevel3 >= window.list.level3num) {
                            return true;
                        }
                        return false;
                    }
                    if ($('.block li')[curr].className === 'active') {
                        // 先判断是否在等待,风险等级是否返回
                        if ($('.loading')[0].style.display === 'none') {

                            // 判断是否出现错误，如果出现错误 从新获取该区的街道,// 关闭弹窗
                            if(getComputedStyle($('.tips-bg')[0]).display === 'block') {
                                window.list.citys[orgcode].curr = 0;
                                $('.tips-bg')[0].style.display = 'none';
                                return false;
                            }

                            if ($('.level-result')[0].className === 'level-result low-risk') {
                                // 低风险
                                console.log($('.block li')[curr].innerHTML, '低风险')
                                list[$('.block li')[curr].getAttribute('data-areacode')] = {
                                    orgname: $('.block li')[curr].innerHTML,
                                    level: 1,
                                }
                            }
                            if ($('.level-result')[0].className === 'level-result medium-risk') {
                                // 低风险
                                console.log($('.block li')[curr].innerHTML, '中风险')
                                list[$('.block li')[curr].getAttribute('data-areacode')] = {
                                    orgname: $('.block li')[curr].innerHTML,
                                    level: 2,
                                }
                            }
                            if ($('.level-result')[0].className === 'level-result high-risk') {
                                // 低风险
                                console.log($('.block li')[curr].innerHTML, '高风险')
                                list[$('.block li')[curr].getAttribute('data-areacode')] = {
                                    orgname: $('.block li')[curr].innerHTML,
                                    level: 3,
                                }
                            }


                            window.list.citys[orgcode].curr ++;
                            return false;

                        } else {
                            return false;
                        }

                    } else {
                        $('.block li')[curr].click();
                        return false;
                    }


                    
                } else {
                    return false;
                }
               

            } else {
                $('.city li')[currlevel3].click();
                return false;
            }
            
            

            return true;
        }

        return false;
    })
    .evaluate(function(){
        return list;
    })
    .end()
    .then(function(res){
        console.log(res);
        // 写入文件
        fs.writeFile('org.json', JSON.stringify(res, null, 4), 'utf8', (err) => {
            if (err) {
                console.log('--写入失败')
            } else {
                console.log('写入成功 √');
            }
        });
    })
    .catch(function (error) {
      console.error('failed:', error);
    });
