// Calls two Android framework methods on a plain JVM: one pure Java, one backed by native code.
public class Probe {
  public static void main(String[] a) {
    try { System.out.println("TextUtils.isEmpty(\"\") = " + android.text.TextUtils.isEmpty("")); }
    catch (Throwable t) { System.out.println("TextUtils.isEmpty threw " + t); }
    try { android.graphics.Bitmap.createBitmap(1, 1, android.graphics.Bitmap.Config.ARGB_8888); System.out.println("Bitmap created"); }
    catch (Throwable t) { System.out.println("Bitmap.createBitmap threw " + t.getClass().getName() + ": " + String.valueOf(t.getMessage()).split("\n")[0]); }
  }
}
