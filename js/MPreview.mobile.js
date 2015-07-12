/**
 * @name     MPreview.mobile.js
 * @desc     移动端图片预览插件，支持手势缩放，双击放大，缩小
 * @depend   QuoJS
 * @author   M.J
 * @date     2015-07-12
 * @URL      http://webjyh.com
 * @reutn    {MPreview}
 * @version  1.0.0
 * @license  MIT
 *
 * @PS If you have any questions, please don't look for me, I don't know anything. thank you.
 */
(function(win, $) {

    "use strict";

    var transition,
        scaleReg = /scale(?:3d)?\(([^\)]+)\)/,
        translateReg = /translate(?:3d)?\(([^\)]+)\)/,
        config = {
            url: null,
            data: null,
            title: '【浏览】',
            params: {},
            wrap: 'body',
            direction: 'top',
            placeholder: 'images/placeholder.gif',
            init: null,
            close: null
        },
        innerHTML =
            '<div class="ui-MPreview-wrap">'+
            '   <div class="ui-MPreview-row">'+
            '       <div class="ui-MPreview-toolbar">'+
            '            <div class="ui-MPreview-back"><a href="javascript:;">〈</a></div>'+
            '            <div class="ui-MPreview-title">{{title}}</div>'+
            '            <div class="ui-MPreview-pages"><span class="ui-MPreview-currentPage">00</span>/<span class="ui-MPreview-countPage">00</span></div>'+
            '        </div>'+
            '        <div class="ui-MPreview-view">'+
            '            <div class="ui-MPreview-imgbox">'+
            '                <ul class="ui-MPreview-imglist"></ul>'+
            '            </div>'+
            '            <div class="ui-MPreview-loading"></div>'+
            '        </div>'+
            '   </div>'+
            '</div>';

    /**
     * @name      将默认配置和选项合并
     * @param     options     {Object}     默认用户的参数
     * @return    {Object}
     */
    var cover = function( options, defaults ) {
        var i, options = options || {};
        for ( i in defaults ){
            if ( options[i] === undefined ) options[i] = defaults[i];
        }
        return options;
    };
    
    /**
     * 判断设备支持 transitionend 的前缀
     */
    var whichTransitionEvent = function() {
        var t,
            el = document.createElement('div'),
            transitions = {
                'WebkitTransition':'webkitTransitionEnd',
                'OTransition':'oTransitionEnd',
                'MozTransition':'transitionend',
                'transition':'transitionend'
            };
        for(t in transitions){
            if( el.style[t] !== undefined ){
                return transitions[t];
            }
        }
    };

    /**
     * @name      格式化当前页的数字
     * @param     val     {Number}     默认用户的参数
     * @return    {String}
     */
    var formatPage = function(val) {
        return val.toString().length < 2 ? '0' + val : val;
    };

    // 构造函数
    var MPreview = function(options) {
        return new MPreview.fn.init(options);
    };

    MPreview.fn = MPreview.prototype = {
        constructor: MPreview,
        init: function(options) {
            //用户配置项
            transition = whichTransitionEvent();
            this.config = cover(options, config);  // 默认配置项
            this.topics = {};                      // 存放订阅内容

            //init 载入之前执行的回调
            if (typeof this.config.init == 'function') this.config.init();

            // 载入订阅内容
            this._action();

            // init 组件默认配置
            this.publish('init')
                .publish('ajax')
                .publish('touch')
                .publish('zoom')
                .publish('resize');

            return this;
        },
        /**
         * @name    订阅发布
         * @type    {Function}
         * @parmas  {key}   订阅的名称
         * @params  {val}   订阅的内容
         * @return  this
         */
        subscribe: function(key, val) {
            if (!this.topics[key]) {
                this.topics[key] = [];
            }
            this.topics[key].push(val);
            return this;
        },

        /**
         * @name    退订发布
         * @type    {Function}
         * @params  {key}    要退订的名称
         * @return  this
         */
        unsubscribe: function(key) {
            if (this.topics[key]) {
                delete this.topics[key];
            }
            return this;
        },

        /**
         * @name    发布订阅的
         * @type    {Function}
         * @return  this
         */
        publish: function(key) {
            if (!this.topics[key]) {
                return false;
            }

            var subscribers = this.topics[key],
                len = subscribers ? subscribers.length : 0,
                args = [].slice.call(arguments);

            args.shift();
            for (var i = 0; i < len; i++) {
                subscribers[i].apply(this, args);
            }

            return this;
        },
        
        /**
         * 获取当前元素 CSS3 属性值
         * @param {Object} elem
         * @param {Object} name
         */
        getTransform: function(e, name) {
            e = $(e);
            
            var val = e.css("transform") || e.css("-webkit-transform"),
                has = val === 'none',
                arr, x, y, reg;
                
                if (name === 'translate') {
                    reg = translateReg;
                    if (has || val.indexOf(name) == -1) {
                        has = true;
                        x = y = 0;
                    }
                } else if(name === "scale") {
                    reg = scaleReg;
                    if (has || val.indexOf(name) == -1) {
                        has = true;
                        x = y = 1;
                    }
                }
                
                if (!has) {
                    arr = val.match(reg);
                    arr = arr[1].split(',');
                    x = parseFloat(arr[0]);
                    y = parseFloat(arr[1]);
                }
                
                return {
                    x: x,
                    y: y
                };
        },

        /**
         * @name    图片等比缩放
         * @param   size
         */
        scale: function(size) {
            if (!size.width || !size.height) {
                return {width: '100%', height: '100%'};
            }

            var r, w = size.width, h = size.height,
                screenW = parseInt(this.offset.width),
                screenH = parseInt(this.offset.height);

            // 图片宽大于屏幕宽
            if(w > screenW) {
                r = screenW / w;
                w = screenW;
                h = Math.floor(h * r);
            }

            // 图片高大于屏幕高
            if (h > screenH) {
                r = screenH / h;
                h = screenH;
                w = Math.floor(w * r);
            }

            return {
                width: w,
                height: h
            };
        },

        /**
         * @name   求两点之间中间点的坐标
         * @params  {a}  点A的坐标
         * @params  {b}  点B的坐标
         * @return  两点之间的距离
         */
        distance: function(a, b) {
            if (!a || !b) return;
            var x = (a.x + b.x) / 2,
                y = (a.y + b.y) / 2;
            return {x: x, y: y};
        },
        /**
         * @name     获取点阵位置
         * @params   {e}    events 事件对象
         * @params   {val}  缩放比  如果为空采用默认指
         * @return   Boolean || Object
         */
        getOrigin: function(e, val) {
            var touchX = val === undefined ? e.touch.x : this.distance(e.touch.touches[0], e.touch.touches[1]).x,    // 点击当前位置X
                touchY = val === undefined ? e.touch.y : this.distance(e.touch.touches[0], e.touch.touches[1]).y,    // 点击当前位置Y
                size = {
                    width: val === undefined ? this.size[this.index-1].width : (parseInt($(e.target).css('width')) * val),
                    height: val === undefined ? this.size[this.index-1].height : (parseInt($(e.target).css('height')) * val)
                },                  // 当前图片原大小
                currentSize = val === undefined ? (this.scale(size)) : ({width: parseInt($(e.target).css('width')), height: parseInt($(e.target).css('height')) }),    // 当前图片现大小
                screen = this.screen,
                scale = val || size.width / currentSize.width,  // 最大缩放比
                imgAreaX = (screen.width - currentSize.width) / 2,     // 图片与容器之间的留白区左边
                imgAreaY = (screen.height - currentSize.height) / 2,   // 图片与容器之间的留白区上边
                originX = touchX - imgAreaX,    //点阵位置X
                originY = touchY - imgAreaY,     //点阵位置Y
                fix, maxTx, minTx, maxTy, minTy;

            if (size.width <= parseInt(this.offset.width, 10) && size.height <= parseInt(this.offset.height, 10)) {
                return false;
            }

            // 图片的宽是否大于当前屏幕宽
            if (size.width > screen.width) {
                fix = size.width - currentSize.width;
                maxTx = (fix * (originX / currentSize.width) - imgAreaX) / scale;
                minTx = 0 - (fix * ((currentSize.width - originX) / currentSize.width) - imgAreaX) / scale;
                if (maxTx < 0) {
                    maxTx = 0;
                    originX = imgAreaX / fix * currentSize.width;
                    minTx = 0 - (fix * ((currentSize.width - originX) / currentSize.width) - imgAreaX) / scale;
                }
                if (minTx > 0) {
                    minTx = 0;
                    originX = currentSize.width - imgAreaX / fix * currentSize.width;
                    maxTx = (fix * (imgAreaX / currentSize.width)) / scale;
                }
            } else {
                originX = currentSize.width / 2;
            }

            // 图片的高是否大于当前屏幕高
            if (size.height > screen.height) {
                fix = size.height - currentSize.height;
                maxTy = (fix * (originY / currentSize.height) - imgAreaY) / scale;
                minTy = 0 - (fix * ((currentSize.height - originY) / currentSize.height) - imgAreaY) / scale;
                if (maxTy < 0) {
                    maxTy = 0;
                    originY = imgAreaY / fix * currentSize.height;
                    minTy = 0 - (fix * ((currentSize.height - originY) / currentSize.height) - imgAreaY) / scale;
                }
                if (minTy > 0) {
                    minTy = 0;
                    originY = currentSize.height - imgAreaY / fix * currentSize.height;
                    maxTy = (fix * (originY / currentSize.height) - imgAreaY) / scale;
                }
            } else {
                originY = currentSize.height / 2;
            }

            return {
                scale: scale,
                x: originX + 'px',
                y: originY + 'px',
                scope: {
                    maxTx: maxTx,
                    minTx: minTx,
                    maxTy: maxTy,
                    minTy: minTy
                }
            };
        },

        /**
         * @name    关闭销毁程序
         * @return  null;
         */
        destroy: function() {
            var has;
            if (typeof this.config.close == 'function') has = this.config.close();
            if (has === false) return;

            // 清空HTML
            $(this.config.wrap).empty();
            $(this.config.wrap).removeAttr('style');
            $(document).off('touchmove');
            $(window).off(this.resizeType);

        },

        /**
         * @name    配置订阅内容
         * @params  null
         * @return  this
         */
        _action: function() {

            // 设置配置项
            this.subscribe('init', function() {
                var _this = this,
                    css = 'width: 100%; height: 100%; overflow: hidden; background: #000';

                this.data = null;       //请求所获取的数据
                this.DOM = null;        //当前组件的DOM元素
                this.index = 1;         //当前所在第几页
                this.size = {};         //对应的图片大小
                this.isExec = false;    //当前动画是否执行完成
                this.touch = null;      //存储最近一次Touch的属性
                this.isScroll = false;  //标识是否为当前滚动状态
                this.isScale = false;   //当前图片是否放大中
                this.isZoom = false;    //标识是否是双指滚动中的事件
                this.imgMoveData = null;  //图片放大移动时缩放的值
                this.zoomInertia = null;  // 双指缩放值以及点阵位置
                this.zoomRecord = 1;      // 记录每次缩放后的缩放值，默认为1，
                this.screen = {
					width: window.innerWidth,
					height: window.innerHeight
				};   
                this.resizeType =  typeof window.orientation == 'number' ? 'orientationchange' : 'resize';  //支持旋转的事件名
                this.config.direction = this.config.direction == 'left' ? true : false;   //滚动方向，true 横屏幕滚动，false 竖屏滚动

                $(_this.config.wrap)[0].style.cssText = css;
                $(document).on('touchmove', function(e) {e.preventDefault(); });
            }); 

            // 创建DOM
            this.subscribe('init', function() {
                var elems, DOM = {},
                    html = innerHTML.replace('{{title}}', this.config.title),
                    elem = $(this.config.wrap),
                    screen = this.screen;
                                
                elem.html(html);
                elems = elem.find('*');
                elems.each(function(i, v) {
                    if (v.className.indexOf('ui-MPreview-') > -1) {
                        var key = v.className.replace('ui-MPreview-', '');
                        DOM[key] = $(v);
                    }
                });

                var h = parseInt(DOM.toolbar.style('height'), 10);
                DOM.wrap.style('width', screen.width + 'px');
                DOM.wrap.style('height', screen.height + 'px');
                DOM.view.style('height', (screen.height - h) + 'px');
                DOM.view.style('top', h + 'px');

                // 当前容器宽高
                this.offset = {
                    width: DOM.view.style('width'),
                    height: DOM.view.style('height')
                };
                this.DOM = DOM;
            });

            // 绑定返回事件
            this.subscribe('init', function() {
                var _this = this;
                this.DOM.back.on('touch', function(e) {
                    e.preventDefault();
                    _this.destroy();
                });
            });

            // 加载图片，并对应设置Key
            this.subscribe('load', function(val, key, callback) {
                var _this = this,
                    load = function( size ) {
                        if (!_this.size[key]) _this.size[key] = size;
                        callback && callback.call(_this, size);
                        setTimeout(function() {
                            _this.DOM.loading.addClass('ui-MPreview-hide');
                        }, 100);
                    };
                $.each(val, function(i, v) {
                    _this.DOM.loading.removeClass('ui-MPreview-hide');
                    var img = new Image();
                    img.src = v;
                    if (img.complete) {
                        load({width: img.width, height: img.height});
                    } else {
                        img.onload = function() {
                            load({width: img.width, height: img.height});
                            img.onload = null;
                        };
                    }
                });
            });

            // Ajax 请求
            this.subscribe('ajax', function() {
                if (!this.config.data && !this.config.url) return;
                
                var _this = this,
                    callback = function(data) {
                        this.data = data.imgs;
                        this.publish('load', [data.imgs[0]], 0, function(size) {
                            this.publish('append', size)
                                .publish('setPage')
                                .publish('preloading', 'next');
                        });
                    };
                
                // 判断是否为自己添加数据
                if (this.config.data && this.config.data.length) {
                    callback.call(this, {imgs: this.config.data});
                    return;
                }
                
                // 无自己数据则发送Ajax请求
                $.ajax({
                    url: this.config.url,
                    data: this.config.params,
                    dataType: 'json',
                    success: function(data) {
                        if (data.code > 0 && data.imgs && data.imgs.length) {
                            callback.call(_this, data);
                        }
                    },
                    error: function() {
                        alert('获取数据失败');
                    }
                });
            });

            // 创建数据DOM
            this.subscribe('append', function(size) {
                var temp = '',
                    DOM = this.DOM,
                    tpl = '<li data-index="{{index}}" style="width: '+ this.offset.width + '; height: ' + this.offset.height + ';"><img src="{{src}}" style="width: {{width}}; height: {{height}};" /></li>',
                    len = this.data.length > 2 ? 3 : this.data.length;

                size = this.scale(size);
                for (var i = 0; i < len; i++) {
                    var src = (i === 0) ? this.data[i] : this.config.placeholder,
                        w = (i === 0) ? size.width + 'px' : '100%',
                        h = (i === 0) ? size.height + 'px' : '100%';
                    temp += tpl.replace('{{index}}', i)
                               .replace('{{src}}', src)
                               .replace('{{width}}', w)
                               .replace('{{height}}', h);
                }

                DOM.imglist.html(temp);
                DOM.imglist.style(this.config.direction ? 'width' : 'height', parseInt(this.offset[this.config.direction ? 'width' : 'height'], 10) * len + 'px');
                DOM.imglist.vendor('transform-origin', '50% 50% 0px');
                DOM.imgbox.addClass('ui-MPreview-show');
                DOM.loading.addClass('ui-MPreview-hide');
            });

            //设置总分页值
            this.subscribe('append', function() {
                this.DOM.countPage.text(formatPage(this.data.length));
            });

            // 设置分页值
            this.subscribe('setPage', function() {
                this.DOM.currentPage.text(formatPage(this.index));
            });

            // 预加载
            this.subscribe('preloading', function(val, callback) {
                var li = document.createElement('li'),
                    _this = this,
                    DOM = this.DOM,
                    index = val == 'next' ? (this.index + 1) : (this.index - 1),
                    append = function(elem, src, key) {
                        _this.publish('load', [src], key, function(size) {
                            size = _this.scale(size);
                            elem.html('<img src="' + src + '" style="width: '+ size.width +'px; height: '+ size.height +'px" />');
                            callback && callback();
                        });
                    };

                // 检测是否预加载到达最小值或最大值
                index--;
                li.style.width = _this.offset.width;
                li.style.height = _this.offset.height;
                
                if (index < 0  || index > (this.data.length-1))  return;
                if (val == 'prev' && this.index == (this.data.length-1)) return;

                // 为第一页所预加载只重构 img;
                if (val == 'next' && _this.index < 3) {
                    append($(DOM.imglist.find('li').get(_this.index)), this.data[index], index);
                    return;
                }

                // 图片预加载处理
                li.setAttribute('data-index', index);
                DOM.imglist.find('li')[val == 'next' ? 'first' : 'last']().remove();
                DOM.imglist[val == 'next' ? 'append' : 'prepend'](li);
                append($(li), this.data[index], index);
            });
            
            // 设置滑动操作
            this.subscribe('touchStyle', function(duration, x, y, timing) {
                var DOM = this.DOM.imglist;
                duration = duration || 0;
                x = x || 0;
                y = y || 0;
                DOM.vendor('transition', '-webkit-transform '+ duration +'ms ' + timing + ' 0s');
                DOM.vendor('transform', 'translate3d(' + x +'px, '+ y +'px, 0px)');
            });

            // 屏幕滚动
            this.subscribe('touch', function() {
                var startTx, startTy, direction, has,
                    _this = this,
                    w = parseInt(_this.offset.width, 10),
                    h = parseInt(_this.offset.height, 10),
                    minTx = parseInt(parseInt(this.offset.width) / 3, 10),
                    minTy = parseInt(parseInt(this.offset.height) / 3, 10),
                    DOM = this.DOM,
                    callback = function() {
                        _this.isScroll = false;
                        _this.isExec = false;
                        if (has) {
                            _this.publish('preloading', direction ? 'next' : 'prev');   
                            var diff = ((_this.index - 1) * (_this.config.direction ? w : h)) - (_this.config.direction ? w : h);
                            if (_this.index == 1) diff = 0;
                            if (_this.index == _this.data.length) diff = diff - (_this.config.direction ? w : h);
                            DOM.imglist.style(_this.config.direction ? 'left' : 'top',  diff < 0 ? '0px' : diff + 'px');
                        }
                    };

                DOM.imgbox.on('touchstart', function(e) {
                    e.preventDefault();
                    if (_this.isExec || _this.isScale || e.touches.length > 1) return;
                    startTx = e.touches[0].clientX;
					startTy = e.touches[0].clientY;
                });

                DOM.imgbox.on('touchmove', function(e) {
                    e.preventDefault();
                    if (_this.isExec || _this.isScale || e.touches.length > 1) return;

                    //标识是否滚动
                    var diff = Math.abs(_this.config.direction ? (e.touches[0].clientX - startTx) : (e.touches[0].clientY - startTy));
                    if (e.touches.length === 1 && diff > 20) {
                        _this.isScroll = true;
                    }

                    var scroll,
                        touches = e.touches[0],
                        currentTx = touches.clientX,
                        currentTy = touches.clientY,
                        fix = _this.index > 1 ? (_this.index-1) * parseInt(_this.config.direction ? _this.offset.width : _this.offset.height, 10) : 0;

                    // 判断滑动方向  true上滑（下一页），false 下滑(上一页)
                    if (_this.config.direction) {
                        direction = startTx - currentTx > 0 ? true : false;
                    } else {
                        direction = startTy - currentTy > 0 ? true : false;
                    }

                    // 回滚操作
                    var diffs = Math.abs(_this.config.direction ? (startTx - currentTx) : (startTy - currentTy));
                    if (!direction && _this.index == 1) {
                        scroll = diffs;
                    } else {
                        scroll = direction ? -(diffs + fix) : -(fix - diffs);
                    }

                    if (_this.config.direction) {
                        _this.publish('touchStyle', 0, scroll, 0, 'ease');
                    } else {
                        _this.publish('touchStyle', 0, 0, scroll, 'ease');
                    }
                });

                DOM.imgbox.on('touchend', function(e) {
                    e.preventDefault();
                    if (_this.isExec ||  _this.isScale || e.touches.length > 1) return;

                    var touches = e.changedTouches[0],
                        endTx = touches.clientX,
                        endTy = touches.clientY;

                    // 设置当前页数
                    _this.isExec = true;
                    has = _this.config.direction ? (Math.abs(startTx - endTx) > minTx ) : (Math.abs(startTy - endTy) > minTy);

                    if (has) {
                        direction ? (_this.index++) : (_this.index--);
                    }
                    if (_this.index > _this.data.length) _this.index = _this.data.length;
                    if (_this.index < 1) _this.index = 1;

                    // 当前滚动操作
                    var scroll= -(_this.index-1) * (_this.config.direction ? w : h);
                    if (_this.config.direction) {
                        _this.publish('touchStyle', 300, scroll, 0, 'ease-out');
                    } else {
                        _this.publish('touchStyle', 300, 0, scroll, 'ease-out');
                    }
                    if (has) _this.publish('setPage');
                });
                
                // CSS3 动画事件回调
                DOM.imgbox.on(transition, callback);

            });

            // 卸载图片滚动
            this.subscribe('untouch', function() {
                var DOM = this.DOM;
                DOM.imgbox.off('touchstart');
                DOM.imgbox.off('touchmove');
                DOM.imgbox.off('touchend');
                DOM.imgbox.off(transition);
            });

            // 图片放大事件
            this.subscribe('zoom', function() {
                var DOM = this.DOM,
          			_this = this;

                // 双击图片放大，缩小
                DOM.imglist.on('doubleTap', 'li', function(e) {
                    _this.publish(_this.isScale ? 'zoomOut' : 'zoomIn', e);
                });

                // 缩放 缩小结束
                DOM.imglist.on('pinchIn', 'img', function(e) {
                    e.preventDefault();
                    
                    if (_this.isScroll) return;
                    var $elem = $(e.target);
                    $elem.off('touchstart');
                    $elem.off('touchmove');

                    // 缩放最小值
                    if (_this.zoomInertia.scale <= 1) {
                        _this.isScale = false;
                        $elem.vendor('transition', '-webkit-transform 300ms ease 0s');
                        $elem.vendor('transform-origin', _this.zoomInertia.x + ' '+ _this.zoomInertia.y +' 0px');
                        $elem.vendor('transform', 'scale3d(1, 1, 1)');
                    } else {
                        if (_this.zoomInertia.scope) {
                            $elem.on('touchstart', function(event) {
                                _this.publish('imgTouchStart', event, this);
                            });
                            $elem.on('touchmove', function(event) {
                                _this.publish('imgTouchMove', event, this, _this.zoomInertia.scope);
                            });
                        }
                    }

                    _this.publish('zoomRecord', e.target);
                });

            	// 缩放中
                DOM.imglist.on('pinching', 'img', function(e) {
                	e.preventDefault();
                	if (_this.isScroll) return;
                    _this.publish('zoomInertia', e);
                });

                //缩放放大结束
                DOM.imglist.on('pinchOut', 'img', function(e) {
                    e.preventDefault();
                    
                    if (_this.isScroll) return;
                    var $elem = $(e.target);
                    $elem.off('touchstart');
                    $elem.off('touchmove');

                    if (_this.zoomInertia.scope) {
                        $elem.on('touchstart', function(event) {
                            _this.publish('imgTouchStart', event, this);
                        });
                        $elem.on('touchmove', function(event) {
                            _this.publish('imgTouchMove', event, this, _this.zoomInertia.scope);
                        });
                    }

                    _this.publish('zoomRecord', e.target);
                });

                //判断是否完成缩放结束，即两手指离开屏幕
                DOM.imglist.on('touchend', 'img', function(e) {
                    if (!e.touches.length && !_this.isScale && _this.isZoom) {
                        _this.isZoom = false;
                        _this.isExec = false;
                        // 修正因直接绑定而导致重复触发 touchend 事件
                        setTimeout(function() {
                            _this.publish('touch');
                        }, 10);
                    }
                });

            });

            //记录上一次 zoom 缩放的值
            this.subscribe('zoomRecord', function(elem) {
                this.zoomRecord = this.getTransform(elem, 'scale').x;
            });
            
            // 双击图片放大
            this.subscribe('zoomIn', function(e) {
                var _this = this,
                    $elem = e.target.nodeName === 'IMG' ? $(e.target) : $(e.target).find('img').first(),
                    origin = this.getOrigin(e);

                if (!origin) return;
                
                _this.isZoom = true;      // 标识当前是双指滚动中的事件        
                this.publish('untouch');  // 卸载图片滚动事件

                //放大时图片Touch事件的绑定
                this.isScale = true;    // 标识图片已放大，禁用上下翻页功能
                $elem.on('touchstart', function(event) {
                    _this.publish('imgTouchStart', event, this);
                });
                $elem.on('touchmove', function(event) {
                    _this.publish('imgTouchMove', event, this, origin.scope);
                });

                //设置样式
                $elem.vendor('transform-origin', origin.x + ' '+ origin.y +' 0px');
                $elem.vendor('transition', '-webkit-transform 300ms ease-out 0s');
                $elem.vendor('transform', 'scale3d(' + origin.scale +', '+ origin.scale +', 1)');

                //设置记录值
                this.publish('zoomRecord', $elem[0]);
            });
            
            // 双击图片缩小
            this.subscribe('zoomOut', function(e) {
                var $elem = e.target.nodeName !== 'IMG' ? $(e.target).find('img').first() : $(e.target),
                    origin = $elem.css('transform-origin') || $elem.css('-webkit-transform-origin');

                this.isScale = false;      // 标识图片是否放大
                this.isZoom = false;      // 标识当前是双指滚动中的事件        
                
                $elem.off('touchstart');
                $elem.off('touchmove');
                $elem.vendor('transform-origin', origin);
                $elem.vendor('transition', '-webkit-transform 300ms ease-out 0s');
                $elem.vendor('transform', 'scale3d(1, 1, 1)');
                
                this.publish('touch');
                this.publish('zoomRecord', $elem[0]);
            });

            // 图片缩放中
            this.subscribe('zoomInertia', function(e) {
                e.preventDefault();
                var scale, nScale,
                    fix,
                    $elem = $(e.target),
                    delta = e.touch.delta,          // 双指滚动的差值
                    w = parseInt($elem.css('width'), 10),
                    defaultWidth = w * this.zoomRecord,   //当前图片的宽度
                    imgWidth = this.size[this.index-1].width,  // 图片原宽度
                    maxZoom = imgWidth / w;

                if (delta === 0) return;

                //双指滚动的差值 / 默认图片的宽度，等于当前图片大小放大了多少倍数，
                //在乘以  图片原宽度，则得出相当于在原图上放大了多少像素
                //然后就是当前图片宽度 + 得出原图的像素， 除以 当前图的宽度，得出放大的倍数
                
                if (!this.isScale) {
                    this.isScale = true;            // 标识是否已放大
                    this.isZoom = true;             // 标识当前是双指滚动中的事件
                    this.publish('untouch');         // 卸载图片滚动事件
                }

                if (delta > 0) {
                    fix = delta / defaultWidth * imgWidth;
                    scale = Math.abs(1 - ((defaultWidth + fix) / defaultWidth));
                    nScale = this.zoomRecord + scale;
                } else {
                    fix = delta / w * defaultWidth;
                    scale = Math.abs(1 - ((w + fix) / w));
                    nScale = this.zoomRecord - scale;
                }

                if (nScale < 0.5) nScale = 0.5;
                if (nScale > maxZoom) nScale = maxZoom;

                this.zoomInertia = this.getOrigin(e, nScale);
                if (!this.zoomInertia) {
                    this.zoomInertia = {
                        scale: nScale,
                        x: '50%',
                        y: '50%'
                    };
                }
                //记录图片放大后要移动图片的值
                this.imgMoveData = {
                    scale: {x: nScale, y: nScale},
                    client: {
                        x: e.touch.touches[0].x,
                        y: e.touch.touches[0].y
                    }
                };

                $elem.vendor('transition', '-webkit-transform 0ms ease 0s');
                $elem.vendor('transform-origin', this.zoomInertia.x + ' '+ this.zoomInertia.y +' 0px');
                $elem.vendor('transform', 'scale3d(' + nScale +', '+ nScale +', 1)');
            });

            // 图片放大移动开始
            this.subscribe('imgTouchStart', function(e, elem) {
                var scale = this.getTransform(elem, 'scale'),
                    touch = e.touches[0];
                this.imgMoveData = {
                    scale: scale,
                    client: {
                        x: touch.clientX,
                        y: touch.clientY
                    }
                };
                $(elem).vendor('transition', '-webkit-transform 0ms ease 0s');
            });

            // 图片放大移动中
            this.subscribe('imgTouchMove', function (e, elem, area) {
                e.preventDefault();

                var translate = this.getTransform(elem, 'translate'),
                    $elem = $(elem),
                    move = this.imgMoveData,                          // 在移动时所记录的图像值
                    touch = e.touches,
                    clientX = touch[0].clientX,                        // 当前Tap的位置 X轴、
                    clientY = touch[0].clientY,                        // 当前Tap的位置 Y轴、
                    x = (clientX - move.client.x) / move.scale.x,      // 将移动的差值按比例减小 X轴
                    y = (clientY - move.client.y) / move.scale.y;      // 将移动的差值按比例减小 Y轴

                if (touch.length > 1 || move.scale.x === undefined || move.scale.y === undefined) {
                    return;
                }

                //更新最新坐标
                this.imgMoveData.client.x = touch[0].clientX;
                this.imgMoveData.client.y = touch[0].clientY;

                // X轴最大最小值检测
                if (area.maxTx !== undefined && area.minTx !== undefined) {
                    translate.x += x;    // 在原有的 translate 更新每一次偏移量
                    if (translate.x > area.maxTx) {
                        translate.x = area.maxTx;
                    } else {
                        if (translate.x < area.minTx) {
                            translate.x = area.minTx;
                        }
                    }
                }

                // Y轴最大最小值检测
                if (area.maxTy !== undefined && area.minTy !== undefined) {
                    translate.y += y;   // 在原有的 translate 更新每一次偏移量
                    if (translate.y > area.maxTy) {
                        translate.y = area.maxTy;
                    } else {
                        if (translate.y < area.minTy) {
                            translate.y = area.minTy;
                        }
                    }
                }

                $elem.vendor('transform', 'scale3d(' + move.scale.x +', '+ move.scale.y +', 1) translate3d(' + translate.x +'px, '+ translate.y +'px, 0px)');
            });

            // Resize
            this.subscribe('resize', function() {
                var c, DOM = this.DOM,
                    _this = this;

                var resize = function() {
                    _this.screen = {
                        width: window.innerWidth,
                        height: window.innerHeight
                    };
                    _this.isExec = false;
                    _this.isZoom = false;
                    _this.isScroll = false;
                    _this.isScale = false;

                    var h = parseInt(DOM.toolbar.style('height'), 10),
                        width = _this.screen.width,
                        height = _this.screen.height,
                        he = height - h,
                        diff = ((_this.index - 1) * (_this.config.direction ? width : he)) - (_this.config.direction ? width : he),
                        scroll = -(_this.index - 1) * (_this.config.direction ? width : he);

                    if (_this.index == 1) diff = 0;
                    if (_this.index == _this.data.length) diff = diff - (_this.config.direction ? width : he);

                    _this.offset = {
                        width: width + 'px',
                        height: he + 'px'
                    };

                    DOM.wrap[0].style.cssText = 'width: ' + width + 'px; height: ' + height + 'px;';
                    DOM.view[0].style.cssText = 'top: ' + h + 'px; height: ' + he + 'px;';
                    DOM.imglist.find('li').each(function(i, elem) {
                        var $img = $(elem).find('img'),
                            index = parseInt($(elem).attr('data-index'), 10),
                            size = _this.size[index] && _this.scale(_this.size[index]);

                        elem.style.cssText = 'width:' + _this.offset.width + '; height: ' + _this.offset.height +';';
                        size && ($img[0].style.cssText = 'width: ' + size.width + 'px; height: ' + size.height + 'px;');
                        $img.vendor('transform-origin', '50% 50% 0px');
                        $img.vendor('transition', '-webkit-transform 0ms ease 0s');
                        $img.vendor('transform', 'scale3d(1, 1, 1) translate3d(0px, 0px, 0px);');
                        $img.off('touchstart');
                        $img.off('touchmove');
                    });
                    DOM.imglist.css(_this.config.direction ? 'left' : 'top', diff < 0 ? '0px' : diff + 'px');
                    DOM.imglist.css(_this.config.direction ? 'width' : 'height', (_this.config.direction ? width : he) * (_this.data.length > 2 ? 3 : _this.data.length) + 'px');

                    // 重新绑定滚动翻页事件
                    if (_this.config.direction) {
                        _this.publish('touchStyle', 0, scroll, 0, 'ease');
                    } else {
                        _this.publish('touchStyle', 0, 0, scroll, 'ease');
                    }
                    _this.publish('untouch').publish('touch');
                };

                //横屏，竖屏切换
                $(window).on(_this.resizeType, function() {
                    clearTimeout(c);
                    c = setTimeout(resize, 300);
                });

            });

            return this;
        }
    };

    MPreview.fn.init.prototype = MPreview.fn;

    // 扩展至全局
    win.MPreview = MPreview;

}(window, $$));