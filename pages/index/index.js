// index.js
// 获取应用实例
const app = getApp()

Page({
  data: {
    'deviceId':'',
    'serviceId':'',
    'characteristicId':'',
    radio_disabled: true,
    text_color: 'gray',
    power_checked:false,
    radio1_checked:false,
    radio2_checked:false,
  },
  onLoad() {
    this.bleInit();
  },
  bleInit() {
    console.log('searchBle')
    // 监听扫描到新设备事件
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach((device) => {
        // 这里可以做一些过滤
        if(device.name != "")
          console.log('Device Found', device);
        //if(device.deviceId == "58:BF:25:9D:51:0E"){
        if(device.name == "ESP32-light"){  
        // 找到设备开始连接
          wx.stopBluetoothDevicesDiscovery();
          this.info_connecting()
          this.bleConnection(device.deviceId);
        }
      })
      // 找到要搜索的设备后，及时停止扫描
      // 
    })

    // 初始化蓝牙模块
    wx.openBluetoothAdapter({
      mode: 'central',
      success: (res) => {
        // 开始搜索附近的蓝牙外围设备
        this.info_finding()
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: false,
        })
      },
      fail: (res) => {
        if (res.errCode !== 10001) return
        wx.onBluetoothAdapterStateChange((res) => {
          if (!res.available) return
          // 开始搜寻附近的蓝牙外围设备
          this.info_finding()
          wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: false,
          })
        })
      }
    })
    var that = this
    wx.onBLECharacteristicValueChange((result) => {
      console.log('onBLECharacteristicValueChange',result.value)
      console.log(result.value)
      let hex = that.ab2hex(result.value)
      that.TxSwitcher(that.hextoString(hex))
      console.log('hextoString',that.hextoString(hex))
      console.log('hex',hex)
    })
  },
  bleConnection(deviceId){
    wx.createBLEConnection({
      deviceId, // 搜索到设备的 deviceId
      success: () => {
        // 连接成功，获取服务
        console.log('连接成功，获取服务')
        this.bleGetDeviceServices(deviceId)
      }
    })
  },
  bleGetDeviceServices(deviceId){
    wx.getBLEDeviceServices({
      deviceId, // 搜索到设备的 deviceId
      success: (res) => {
        console.log("Services:", res.services)
        this.bleGetDeviceCharacteristics(deviceId,res.services[0].uuid)
      }
    })
  },
  bleGetDeviceCharacteristics(deviceId,serviceId){
    wx.getBLEDeviceCharacteristics({
      deviceId, // 搜索到设备的 deviceId
      serviceId, // 上一步中找到的某个服务
      success: (res) => {
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          console.log("item:",item)
          console.log("serviceId:",this.data.serviceId)
          if (item.properties.write) { // 该特征值可写
            // 本示例是向蓝牙设备发送一个 0x00 的 16 进制数据
            // 实际使用时，应根据具体设备协议发送数据
            // let buffer = new ArrayBuffer(1)
            // let dataView = new DataView(buffer)
            // dataView.setUint8(0, 0)
            // let senddata = 'FF';
            // let buffer = this.hexString2ArrayBuffer(senddata);
            this.setData({
              'deviceId':deviceId,
              'serviceId':serviceId,
              'characteristicId':item.uuid
            });
            this.get_pbCounter();
          }
          if (item.properties.read) { // 该特征值可读
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
            })
          }
          if (item.properties.notify || item.properties.indicate) {
            // 必须先启用 wx.notifyBLECharacteristicValueChange 才能监听到设备 onBLECharacteristicValueChange 事件
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
            })
          }
        }
      }
    })
  },
  stringToBytes(str) {
    var array = new Uint8Array(str.length);
    for (var i = 0, l = str.length; i < l; i++) {
      array[i] = str.charCodeAt(i);
    }
    console.log(array);
    return array.buffer;
  },
  hextoString: function (hex) {
    var arr = hex.split("")
    var out = ""
    for (var i = 0; i < arr.length / 2; i++) {
      var tmp = "0x" + arr[i * 2] + arr[i * 2 + 1]
      var charValue = String.fromCharCode(tmp);
      out += charValue
    }
    return out
  },
  ab2hex(buffer) {
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join('');
  },
  get_pbCounter()
  {
    console.log("获取pbCounter");
    var buffer = this.stringToBytes("get_pbCounter")
    wx.writeBLECharacteristicValue({
      deviceId:this.data.deviceId,
      serviceId:this.data.serviceId,
      characteristicId:this.data.characteristicId,
      value: buffer,
    })
  },
  power_on(){
    var buffer = this.stringToBytes("power_on")
    wx.writeBLECharacteristicValue({
      deviceId:this.data.deviceId,
      serviceId:this.data.serviceId,
      characteristicId:this.data.characteristicId,
      value: buffer,
    })
  },
  mode_lit(){
    var buffer = this.stringToBytes("mode_lit")
    wx.writeBLECharacteristicValue({
      //deviceId:"58:BF:25:9D:51:0E",
      deviceId:this.data.deviceId,
      serviceId:this.data.serviceId,
      characteristicId:this.data.characteristicId,
      value: buffer,
    })
  },
  power_off(){
    var buffer = this.stringToBytes("power_off")
    wx.writeBLECharacteristicValue({
      deviceId:this.data.deviceId,
      serviceId:this.data.serviceId,
      characteristicId:this.data.characteristicId,
      value: buffer,
    })
  },
  mode_atm(){
    var buffer = this.stringToBytes("mode_atm")
    wx.writeBLECharacteristicValue({
      deviceId:this.data.deviceId,
      serviceId:this.data.serviceId,
      characteristicId:this.data.characteristicId,
      value: buffer,
    })
  },
  BLE_Switch:function(e){
    console.log('on/off开关当前状态-----', e.detail.value);
    if(e.detail.value){
        wx.showToast({
            title:'已开启', 
            icon:'success', 
            duration:1000
            });
        this.power_on();
        this.setData({text_color: 'black'});
        this.setData({radio_disabled:!this.data.radio_disabled});
        this.setData({radio1_checked:!this.data.radio1_checked});
    }
    else{
        wx.showToast({
            title:'已关闭', 
            icon:'error', 
            duration:1000
        });
        this.power_off();
        this.setData({text_color: 'gray'});
        this.setData({radio_disabled:!this.data.radio_disabled});
        this.setData({radio1_checked:!this.data.radio1_checked});
        this.setData({radio2_checked:false});
    }
  },
  BLE_Mode:function(e){
      var str = e.detail.value;
      console.log('夜灯模式发生切换,目前状态为-----', e.detail.value);
      if(str == "lit"){
        wx.showToast({
          title:'切换到照明', 
          icon:'success', 
          duration:1000
          });
        this.mode_lit();
      }
      else if(str == "atm"){
        wx.showToast({
          title:'切换到氛围', 
          icon:'success', 
          duration:1000
          });
        this.mode_atm();
      }
  },
  info_finding(){
    wx.showLoading({
      title: '正在查找蓝牙设备',
      mask:true,
    })
  },
  info_connecting(){
    wx.showLoading({
      title: '正在连接',
      mask:true,
    })
  },
  info_connected(){
    wx.hideLoading(),
    wx.showToast({
      title:'连接成功', 
      icon:'success', 
      duration:1000,
      });
  },
  BLE_reconnect(){
    wx.closeBluetoothAdapter({
      success: (res) => {
        console.log(res);
        wx.showToast({
          title:'蓝牙已断开',
          icon:'success',
          duration:500
        });
      },
    });
    this.bleInit();
  },
  TxSwitcher(str){
    this.info_connected()
    if(str == "pbCounter=0")
    {
      this.setData({power_checked:false})
      this.setData({text_color: 'gray'});
      this.setData({radio_disabled:true});
      this.setData({radio1_checked:false});
      this.setData({radio2_checked:false});
    }
    else if(str == "pbCounter=1")
    {
      this.setData({power_checked:true})
      this.setData({text_color: 'black'});
      this.setData({radio_disabled:false});
      this.setData({radio1_checked:true});
      this.setData({radio2_checked:false});
    }
    else if(str == "pbCounter=2")
    {
      this.setData({power_checked:true})
      this.setData({text_color: 'black'});
      this.setData({radio_disabled:false});
      this.setData({radio1_checked:false});
      this.setData({radio2_checked:true});
    }
  }
})
  
