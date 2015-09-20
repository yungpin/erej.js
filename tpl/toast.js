module.exports = function(anima) {
  return (function(data) {
    var out = '<div class="erej-toast ';
    out += (data.classname);
    out += '"> <div class="mask"></div> <div class="wrap"> <div class="content"> <i class="';
    out += (data.icon);
    out += '"></i> <span>';
    out += (data.msg);
    out += '</span> </div> </div></div>';
    return out;
  })(anima.data)
};