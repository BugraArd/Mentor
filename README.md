# MENTOR

Türkiye'deki öğretmenlerin öğrencilerine uzaktan mentörlük yapmasını sağlayan web uygulaması.

## Teknoloji

- Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind v4
- Supabase (Postgres + Auth + Row Level Security), EU bölgesi (KVKK)
- Vercel (deploy)

## Klasör yapısı

- `web/` — Next.js uygulaması
- `supabase/schema.sql` — canlı veritabanıyla senkron tutulan kapsamlı şema (tablolar, RLS
  politikaları, fonksiyonlar)
- `supabase/fix-*.sql` — şemaya sırayla uygulanmış küçük düzeltme/göç dosyaları — geçmiş
  referans için saklanıyor, `schema.sql` içine zaten işlendiler

## Kurulum

1. `cd web && npm install`
2. `cp .env.example .env.local` ve Supabase proje URL/anon key değerlerini doldur
   (Supabase Dashboard → Project Settings → API)
3. `supabase/schema.sql`'i Supabase SQL Editor'de çalıştır (yeni/temiz bir proje için
   `fix-*.sql` dosyalarına gerek yok — hepsi `schema.sql` içine işlendi)
4. `npm run dev` → http://localhost:3000

## Roller

Öğretmen (mentör), Öğrenci (mentee) — Faz 2/3'te Veli ve Admin eklenecek.

## Fazlar

- **Faz 1 (MVP, büyük ölçüde tamam):** kayıt/giriş, davet koduyla mentör-öğrenci eşleşmesi,
  ödev oluşturma/atama, zamanlanmış ödev, teslim + revizyon döngüsü, rubrik puanlama,
  mentöre özel gizli notlar, bildirimler, "görüldü" bilgisi, aydınlık/karanlık tema.
  Kalanlar: gerçek dosya yükleme (şu an sadece URL yapıştırma), bildirim sessiz saatleri.
- **Faz 2:** mesajlaşma, takvim/randevu, Deneme Analizi (PDF karne okuma + AI), ısı haritası,
  SOS butonu, anonim soru kutusu, şablon kütüphanesi.
- **Faz 3:** canlı görüntülü görüşme, veli paneli, kurum yönetimi, rozet/ödül, çalışma serisi
  (streak), aylık PDF rapor.

## Mimari notları

- Next.js 16'da `middleware.ts` yerine `src/proxy.ts` kullanılıyor (fonksiyon adı `proxy`);
  `cookies()`/`params` async-only. Kod yazmadan önce `web/node_modules/next/dist/docs/`
  içindeki ilgili kılavuzu oku.
- Uygulamada cron/zamanlanmış görev yok — zamanlanmış ödevin durumu (`scheduled`→`active`)
  DB'deki `status` alanına değil, `web/src/lib/assignment-time.ts`'teki yardımcılara göre her
  render'da canlı hesaplanıyor.
- `submissions` tablosu versiyonlu (revizyon döngüsü) — bir (ödev, öğrenci) ikilisinin gerçek
  en güncel sürümünü bulmak için önce version'a göre sıralayıp tekilleştirmek gerekiyor,
  durum filtresi bundan sonra uygulanmalı.
