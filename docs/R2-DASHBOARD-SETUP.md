# Load file R2 từ Cloudflare lên Dashboard

Dashboard R2 gọi API `GET /api/dashboard/r2/objects` với `bucket` và `prefix` để lấy danh sách file từ Cloudflare R2. Nếu không thấy dữ liệu, kiểm tra lần lượt các bước sau.

## 1. Biến môi trường (.env)

Cần có **đủ** các biến sau (thiếu một cái là API có thể throw và trả 500):

| Biến | Mô tả | Ví dụ |
|------|--------|--------|
| `R2_ENDPOINT` | URL S3 API của R2 | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | Access Key (tạo trong R2 → Manage R2 API Tokens) | |
| `R2_SECRET_ACCESS_KEY` | Secret Key đi kèm Access Key | |
| `R2_BUCKET_NAME` hoặc `R2_BUCKET` | Tên một bucket bất kỳ (dùng cho config mặc định) | `video` |
| `R2_PUBLIC_URL` hoặc `R2_PUBLIC_BASE_URL` | URL public để xem file (custom domain hoặc R2.dev) | `https://pub-xxx.r2.dev` hoặc `https://img.example.com` |

- **Lấy Endpoint**: Trong Cloudflare Dashboard → R2 → bucket → S3 API, copy endpoint (dạng `https://<account_id>.r2.cloudflarestorage.com`).
- **Tạo API Token**: R2 → Manage R2 API Tokens → Create API token, quyền Object Read & Write, gắn bucket cần dùng (hoặc All buckets). Copy **Access Key ID** và **Secret Access Key** vào `.env`.
- **Public URL**: Nếu dùng R2.dev: bật “Public” cho bucket, copy “Public bucket URL”. Nếu dùng custom domain: dùng domain đó (không dấu `/` cuối).

Sau khi sửa `.env`, **restart server** (dev hoặc process chạy Next).

## 2. Đúng bucket và quyền

- Trên dashboard bạn chọn bucket bằng URL: `/dashboard/admin/r2/[bucket]`. Tên `bucket` phải **trùng tên bucket trên Cloudflare** (ví dụ `video`, `nsh`, `movie-poster`).
- API token phải có quyền **đọc** (ít nhất) bucket đó. Nếu token chỉ gắn một bucket thì chỉ bucket đó list được; token “All buckets” thì list được mọi bucket.

## 3. Bucket có object không?

- R2 “folder” chỉ là prefix trong key (ví dụ `videos/nsh/phim-a/`). Nếu bucket thật sự chưa có object nào thì API vẫn 200 nhưng `folders` và `files` rỗng.
- Cách kiểm tra: Cloudflare Dashboard → R2 → chọn bucket → xem có object không. Hoặc upload thử một file qua dashboard R2 rồi refresh lại trang dashboard của bạn.

## 4. Xem lỗi cụ thể từ API

- Mở DevTools (F12) → tab **Network**.
- Vào trang bucket (ví dụ `/dashboard/admin/r2/video`), tìm request `objects?bucket=video&prefix=...`.
  - **Status 200**: API thành công. Nếu `folders`/`files` rỗng thì do bucket trống hoặc prefix không khớp.
  - **Status 500**: Click vào request → tab **Response**. Phần `error` trong JSON là thông báo lỗi từ server (ví dụ `Missing/invalid R2 env configuration`, `Cần R2_BUCKET...`, hoặc lỗi từ AWS SDK). Dashboard giờ cũng hiển thị nội dung này trên UI khi load lỗi.
- Xem log server (terminal chạy `npm run dev` hoặc log production) để thấy stack trace khi có exception.

## 5. Prefix khi ở root bucket

- Ở root bucket, client gửi `prefix=` (rỗng). API sẽ list **toàn bộ** object trong bucket (prefix rỗng).
- Nếu bạn chỉ muốn list một prefix cố định (ví dụ `videos/`), có thể đổi default trong `app/api/dashboard/r2/objects/route.ts` (hiện tại khi không gửi prefix thì mặc định là `videos/` chỉ khi `parsed.data.prefix` là `undefined`; client đang gửi `prefix=""` khi ở root nên vẫn list toàn bucket).

## Tóm tắt checklist

1. `.env` đủ: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (hoặc `R2_BUCKET`), `R2_PUBLIC_URL` (hoặc `R2_PUBLIC_BASE_URL`).
2. Restart server sau khi sửa `.env`.
3. Token R2 có quyền đọc bucket đang mở trên dashboard.
4. Bucket thật sự có ít nhất một object (hoặc chấp nhận danh sách trống).
5. Dùng Network tab và thông báo lỗi trên UI để đọc lỗi chi tiết từ API.
