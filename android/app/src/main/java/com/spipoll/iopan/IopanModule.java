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
import java.io.FileOutputStream;
// import java.io.FileInputStream;
  import android.content.res.Resources;
import java.util.Locale;
import java.util.List;
import android.location.Address;
import android.location.Geocoder;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import android.media.ExifInterface;

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


  @ReactMethod
  public void cropBitmap(
    String path, 
    double x,
    double y, 
    double w,
    double h,
    double rotation,
    double scale,
    final Promise promise) {


    WritableNativeMap returnValue = new WritableNativeMap();
      returnValue.putString("_path", path);
      returnValue.putDouble("_x", (double)x);
      returnValue.putDouble("_y", (double)y);
      returnValue.putDouble("_w", (float)w);
      returnValue.putDouble("_h", (float)h);
      returnValue.putDouble("_rotation", rotation);
      returnValue.putDouble("_scale", (float)scale);  

    try {
     
      // final image
      // Bitmap.createBitmap(bitmapWidth, bitmapHeight, Bitmap.Config.ARGB_8888);

      // Load bitmap.
returnValue.putString("00", "GO");

      Bitmap bitmap = null;
      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inPreferredConfig = Bitmap.Config.ARGB_8888;

      bitmap = BitmapFactory.decodeFile(path, options);
      
      if(bitmap==null){
        returnValue.putString("20 error", "bmp Loaded");
      }
  
      returnValue.putString("30 ", "bmp Loaded");
  
      // Rotate
      bitmap = rotateBitmap(bitmap, (float)rotation);
      returnValue.putString("40 ", " ");

      // Translation
      // bitmap = translateBitmap(bitmap, (float)x, (float)y);

      returnValue.putString("45 ", " ");
      
      // Scale
bitmap = Bitmap.createScaledBitmap(bitmap,
         500, 375, 
          false);



returnValue.putString("50 ", " ");

        // BASE 64
          Bitmap bitmap64 = null;
          bitmap64 = rotateBitmap(bitmap, -90);
          ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
          bitmap64.compress(Bitmap.CompressFormat.PNG, 30, outputStream);
          String motionBase64 = Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT);
          outputStream = null;
  returnValue.putString("motionBase64",motionBase64);

      // Crop



returnValue.putString("60", " ");


      // Save  as file.
      String filname = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM) + "/test.jpg";
      try {
          FileOutputStream fOutputStream = new FileOutputStream(filname);
          bitmap.compress(Bitmap.CompressFormat.JPEG, 80, fOutputStream);
          fOutputStream.flush();
          fOutputStream.close();
          fOutputStream = null;
      } catch (Resources.NotFoundException e) {
          returnValue.putString("error","motion Documents directory of the app could not be found."+filname);
          promise.resolve(returnValue);
      } catch (IOException e) {
          returnValue.putString("error","motion An unknown I/O exception has occurred."+filname);
          promise.resolve(returnValue);
      }


  ExifInterface exifSource = new ExifInterface(path);
  ExifInterface exifDest = new ExifInterface(filname);
  exifDest.setAttribute(ExifInterface.TAG_ORIENTATION, exifSource.getAttribute(ExifInterface.TAG_ORIENTATION));
  exifDest.saveAttributes();

  returnValue.putString("55 ", "copyExifRotation");



returnValue.putString("99", "file saved");


      promise.resolve(returnValue);

    } catch (Exception e) {
      returnValue.putString("ERROR", "ERROR");
      promise.resolve(returnValue);
    }
  }


  public static Bitmap rotateBitmap(Bitmap source, float angle){
    Matrix matrix = new Matrix();
    matrix.postRotate(angle);
    return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
  }

  public static Bitmap translateBitmap(Bitmap source, float x, float y){
    Matrix matrix = new Matrix();
    matrix.postTranslate(x,y);
    return Bitmap.createBitmap(source, 0, 0, source.getWidth(), source.getHeight(), matrix, true);
  }

}

