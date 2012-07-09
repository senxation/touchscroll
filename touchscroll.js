$.fn.touchscroll = function(options) {
    options = options || {};
	
	var onscroll = options.onscroll || function(){},
		container = $(this), 
		child = $(this).children().first().css({
			WebkitTransformStyle: "preserve-3d",
			WebkitTransitionDuration: "0ms",
			MozTransformStyle: "preserve-3d",
            MozTransitionDuration: "0ms"
		}),
		indi = $('<div>').css({
			WebkitTransformStyle: "preserve-3d",
			WebkitTransitionDuration: "0ms",
			MozTransformStyle: "preserve-3d",
            MozTransitionDuration: "0ms",
			position : 'absolute',
			top : "1px",
			right : "1px",
			width : "5px",
			height : "20px",
			backgroundColor : "#000",
			opacity : 0
		}).appendTo(container),
		info = {
			y : 0
		},
		scrollTo = function(pos) {
            info.y = pos;
            child.css({
                WebkitTransform: "translateY(" + pos + "px)",
                MozTransform: "translateY(" + pos + "px)"
            });
            if (info.minY < 0) {
                var g = Math.min(Math.abs(closerEdge(pos) - pos), 100),
                    indi_maxY = 1,
                    indi_minY = (info.containerHeight - info.indiHeight) - 3,
                    indi_pos = (pos / info.minY) * indi_minY,
                    indi_height = Math.max(Math.floor(((100 - g) / 100) * info.indiHeight), 5);
                
                if (indi_pos <= info.maxY) {
                    indi.css({
                        height : indi_height
                    });
                    indi_pos = indi_maxY;
                }
                if (indi_pos >= indi_minY) {
                    indi.css({
                        height : indi_height
                    });
                    indi_pos = (info.containerHeight - indi_height - 3);
                }
                indi.css({
                    WebkitTransform : "translateY(" + (indi_pos) + "px)",
                    MozTransform : "translateY(" + (indi_pos) + "px)"
                });
                
                onscroll(pos);
            }
        },
        pos = function() {
            return info.y; 
        },
		momentum = function(touch) {
            var rate = 0.92, now = Date.now(), t = Math.max(now - info.lastEventTime, 1), y = info.y, v = Math.abs(info.velocityY), newY = (y + info.velocityY * (t / 10)), e = closerEdge(newY), g1 = Math.abs(y - newY), g2 = Math.abs(e - newY);
            
            if (g1 < 0.1 && g2 < 5) {
                finish(e);
                return;
            } 
            if(g1 < 0.1 && newY > info.minY && newY < info.maxY) {
                finish(Math.round(newY));
                return;
            }
    
            info.y = newY;
            scrollTo(info.y);
    
            info.velocityY *= Math.pow(rate, (t / 10));
            info.velocityY = bounce(info.velocityY, info.y, info.minY, info.maxY, 0.05, 0.1, 0.05);
    
            info.lastEventTime = now;
            info.timeout = setTimeout(function() {
                momentum(touch);
            }, 0);
        }, 
        edgeResistance = function(offset, minOffset, maxOffset, resistanceCoefficient, asymptote) {
            var distanceFromEdge;
            if(offset < minOffset) {
                distanceFromEdge = offset - minOffset;
            } else if(offset > maxOffset) {
                distanceFromEdge = maxOffset - offset;
            } else {
                return offset;
            }
    
            distanceFromEdge = Math.pow(resistanceCoefficient, Math.abs(distanceFromEdge)) * asymptote;
            distanceFromEdge = (offset < minOffset) ? (distanceFromEdge - asymptote) : -(distanceFromEdge - asymptote);
            return closerEdge(offset) + distanceFromEdge;
        }, 
        bounce = function(velocity, value, minValue, maxValue, de, ac, additionalAcceleration) {
            if(value < minValue) {
                if(velocity < 0) {
                    velocity += ((minValue - value) * de);
                } else {
                    velocity = Math.min((minValue - value) * ac + additionalAcceleration, minValue - value - 0.01);
                }
            } else if(value > maxValue) {
                if(velocity > 0) {
                    velocity -= ((value - maxValue) * de);
                } else {
                    velocity = -Math.min((value - maxValue) * ac + additionalAcceleration, value - maxValue - 0.01);
                }
            }
            return velocity;
        }, 
        closerEdge = function(y) {
            var minGap = (info.y - info.minY), maxGap = (info.y - info.maxY);
            return (Math.abs(minGap) < Math.abs(maxGap)) ? info.minY : info.maxY;
        },
        ready = function() {
            if(info.timeout) {
                clearTimeout(info.timeout);
            }
            if(info.scrollTimeout) {
                clearTimeout(info.scrollTimeout);
            }
            if(info.moveTimeout) {
                clearTimeout(info.moveTimeout);
            }
            info.timeout = null;
            info.scrollTimeout = null;
            info.moveTimeout = null;
            info.touched = true;
            info.lastEventTime = +new Date();
            info.touchY = null;
            info.touchEndY = null;
            info.startY = null;
            info.distY = 0;
            info.velocityY = 0;
            info.containerHeight = container.height();
            info.childHeight = child.height();
            info.minY = info.containerHeight - info.childHeight;
            info.maxY = 0;
            info.indiHeight = Math.min(Math.max(Math.round(info.containerHeight / Math.max(info.containerHeight, info.childHeight) * info.containerHeight), 32), info.containerHeight * 0.9);
        }, 
        finish = function(y) {
            clearTimeout(info.timeout);
            scrollTo(y);
            info.timeout = null;
            info.touched = false;
            info.scrollTimeout = setTimeout(function(){
                indi.stop().clearQueue().animate({
                    opacity : 0
                }, 300);
            }, 50);
        }, 
        start = function(e) {
            var event = e.originalEvent;
            if (!info.touched) {
                ready();
                if (typeof event !== "undefined"&& event.touches.length === 1 && event.targetTouches.length === 1 && event.changedTouches.length === 1) {
                    info.touchY = event.touches[0].pageY;
                }
                
                info.startY = info.y;
            }
        }, 
        move = function(e) {
            var event = e.originalEvent,
                y, lastDistY, timestamp;
            if(info.touched) {
                if (info.moveTimeout) {
                    clearTimeout(info.moveTimeout);
                }
                if (!(event.touches.length === 1 && event.targetTouches.length === 1 && event.changedTouches.length === 1)) {
                    return;
                }
                e.preventDefault();
                
                y = event.touches[0].pageY;
                lastDistY = info.distY || 0;
                    
                if (lastDistY === 0 && info.minY < 0) {
                    indi.stop().clearQueue().css({
                        height : info.indiHeight + "px",
                        opacity : 0.5
                    });
                }
    
                info.distY = y - info.touchY;
                info.y = info.startY + info.distY;
    
                timestamp = +new Date();
                if (timestamp > info.lastEventTime) {
                    info.velocityY = (info.distY - lastDistY) / Math.max(1, timestamp - info.lastEventTime);
                    info.velocityY *= 10;
                    info.lastEventTime = timestamp;
                }
                info.y = edgeResistance(info.y, info.minY, info.maxY, 0.998, 240);
                scrollTo(info.y);
                info.moveTimeout = setTimeout(function(){
                    info.velocityY = 0;
                }, 100);
            }
        }, 
        end = function(e) {
            var event = e.originalEvent;
            if (info.moveTimeout) {
                clearTimeout(info.moveTimeout);
                e.preventDefault();
                e.stopPropagation();
            }
            if (info.touched && event.touches.length === 0 && event.targetTouches.length === 0) {
                info.touched = false;
                info.touchEndY = info.y;
                info.lastVelocityY = info.velocityY;
                momentum(info);
            }
        };
	
	if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
		indi.css({
			top : "0px",
			border : "1px solid #fff",
			borderRadius : "5px"
		});
	}	
		
	$(this).bind("touchstart", start).bind("touchmove", move).bind("touchend", end);
	
	this.scrollTo = scrollTo;
	this.pos = pos;
	return this;
};