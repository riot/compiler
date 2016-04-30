riot.tag2('slide', '<div class="image-slide" each="{url,index in imgList}"><img class="slider-item" riot-src="{url}"></div>', '', '', function(opts) {
this.imgList = ['abc', 'bdc'];
});