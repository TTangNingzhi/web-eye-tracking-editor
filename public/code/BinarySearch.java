public class BinarySearch {

    // Returns the index of the element if found, otherwise returns -1
    public static int binarySearch(int[] arr, int element) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == element) return mid;
            if (arr[mid] < element) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}