package com.spipoll;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import com.facebook.react.bridge.Callback;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Environment;

import  android.content.Context;
import  android.support.v4.content.ContextCompat;

import java.io.IOException;
import java.io.File;
import java.util.Locale;
import java.util.List;
import android.location.Address;
import android.location.Geocoder;

public class IopanModule extends ReactContextBaseJavaModule {

  private Context mContext;

  public IopanModule(ReactApplicationContext reactContext) {
    super(reactContext);
    mContext = reactContext;
  }


  // private boolean firstRun = true;
  // private Bitmap bitmapG = null;
  // private WritableNativeArray pixelG = new WritableNativeArray();
  // private int[][] previousRed;

  
  @Override
  public String getName() {
    return "ioPan";
  }


  @ReactMethod
  public void getLocationName(double lat, double lng, final Promise promise) {
    try {

      Geocoder geocoder = new Geocoder(mContext, Locale.FRENCH);
      List<Address> addresses = geocoder.getFromLocation(lat, lng, 1);
      Address obj = addresses.get(0);

      String add = obj.getLocality();//getAddressLine(0);
      // add = add + "," + obj.getAdminArea();
      // add = add + "," + obj.getCountryName();

      promise.resolve(add);

    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void getLocationCoord(String locationName, final Promise promise) {
    try {

      Geocoder geocoder = new Geocoder(mContext, Locale.FRENCH);
      List<Address> addresses = geocoder.getFromLocationName(locationName,1);
      Address obj = addresses.get(0);

      WritableNativeMap rv = new WritableNativeMap();
      rv.putDouble("lat", obj.getLatitude());
      rv.putDouble("lng", obj.getLongitude());
      promise.resolve(rv);

    } catch (Exception e) {
      promise.reject(e);
    }
  }


  @ReactMethod
  public void getBatteryInfo(final Promise promise) {
    try {
      Intent batteryIntent = getCurrentActivity().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
      int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
      int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

      if(level == -1 || scale == -1) {
          level = 0;
      }

      int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
      boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING;
      
      WritableNativeMap rv = new WritableNativeMap();
      rv.putBoolean("charging", isCharging);
      rv.putInt("level", level);

      promise.resolve(rv);

    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void getBatteryStatus(Callback successCallback) {
    Intent batteryIntent = getCurrentActivity().registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
    int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

    if(level == -1 || scale == -1) {
        level = 0;
    }

    int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
    boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING;
    
    WritableNativeMap rv = new WritableNativeMap();
    rv.putBoolean("charging", isCharging);
    rv.putInt("level", level);

    successCallback.invoke(rv);
  }

  @ReactMethod
  public void getExternalStorages(final Promise promise) {
    try {
    
        String rv = "[";
        File[] aDirArray = ContextCompat.getExternalFilesDirs(mContext, null);
        for(int i =0; i<aDirArray.length;i++){
          String type = "";
          if (Environment.isExternalStorageRemovable(aDirArray[i])){
            if (Environment.getExternalStorageState(aDirArray[i]).equals(Environment.MEDIA_MOUNTED)){
              rv += "{\"type\":\"card\", \"path\":\""+aDirArray[i].getAbsolutePath()+"\"}";
            }
          }
          else{
            rv += "{\"type\":\"phone\", \"path\":\""+aDirArray[i].getAbsolutePath()+"\"}";
          }

          if(i<aDirArray.length-1){
            rv += ",";
          }
        }
        rv += "]";
        // if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED)) {
        //   File[] f;
        //   rv += " --- getExternalMediaDirs: ";
        //   f = mContext.getExternalMediaDirs();//mContext.getExternalMediaDirs()
        //   for(int i =0; i<f.length;i++){
        //     rv += f[i].getAbsolutePath() + " - ";
        //   }

        //   rv += " --- getExternalFilesDirs:";
        //   f = mContext.getExternalFilesDirs(Environment.DIRECTORY_PICTURES);//mContext.getExternalMediaDirs()
        //   for(int i =0; i<f.length;i++){
        //     rv += f[i].getAbsolutePath() + " - ";
        //   }

        //   // rv += " --- getExternalCacheDirs: ";
        //   // f = mContext.getExternalCacheDirs();//mContext.getExternalMediaDirs()
        //   // for(int i =0; i<f.length;i++){
        //   //   rv += f[i].getAbsolutePath() + " - ";
        //   // }


           promise.resolve(rv);
        // } else {
        //     promise.reject("RNFetchBlob.getSDCardDir", "External storage not mounted");
        // }
    } catch (Exception e) {
      promise.reject(e);
    }
    
  }



}

