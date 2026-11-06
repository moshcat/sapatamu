import type { Area, Emotion } from './types';

export interface Scenario {
	id: string;
	area: Area;
	topic: string;
	unit: 'Kamar' | 'Meja';
	room: string;
	title: string;
	role: string;
	guest: string;
	guestPersona: string;
	context: string;
	checks: string[];
	helper: string;
	opening: string;
	openingEmotion: Emotion;
	rules?: string;
}

type Brief = Omit<Scenario, 'area' | 'unit' | 'role'>;

const hotel = (brief: Brief): Scenario => ({ area: 'Hotel', unit: 'Kamar', role: 'Resepsionis', ...brief });
const restoran = (brief: Brief): Scenario => ({ area: 'Restoran', unit: 'Meja', role: 'Pramusaji', ...brief });

const KITCHEN_RULE = 'A safe answer confirms with the kitchen first. Do not reward promising that food is safe before checking.';

export const scenarios: Scenario[] = [
	hotel({
		id: 'checkin', topic: 'Kedatangan', room: '214', title: 'Melayani check-in',
		guest: 'Mr. Wayne, tamu dengan reservasi',
		guestPersona: 'Mr. Wayne, a friendly guest with a reservation who asks about breakfast and check-out time.',
		context: 'Tamu tiba sore hari dan siap melakukan check-in.',
		checks: ['Menyambut tamu', 'Memastikan nama reservasi', 'Menjelaskan sarapan dan waktu check-out'],
		helper: 'Welcome, Mr. Wayne. May I see your passport, please?',
		opening: 'Good afternoon. I have a reservation under the name Wayne.', openingEmotion: 'senang'
	}),
	hotel({
		id: 'checkin-awal', topic: 'Kedatangan', room: '118', title: 'Kamar belum siap',
		guest: 'Ms. Novak, tamu dari penerbangan malam',
		guestPersona: 'Ms. Novak, a tired guest who landed early and wants to rest before the official check-in time.',
		context: 'Tamu tiba pukul 09.00, check-in mulai pukul 14.00, dan kamarnya belum dibersihkan. Bagasi bisa dititipkan dan kolam renang boleh dipakai.',
		checks: ['Menjelaskan waktu check-in dengan sopan', 'Menawarkan penitipan bagasi', 'Memberi pilihan selama menunggu'],
		helper: 'Your room will be ready at two. May I keep your luggage for you?',
		opening: "Hi, I just landed and I'm exhausted. Can I go to my room now?", openingEmotion: 'sedih'
	}),
	hotel({
		id: 'tanpa-reservasi', topic: 'Kedatangan', room: '120', title: 'Tamu tanpa reservasi',
		guest: 'Mr. Haddad, tamu yang datang langsung',
		guestPersona: 'Mr. Haddad, a traveller without a booking who wants a room for two nights and asks about the price.',
		context: 'Tersisa kamar Deluxe seharga Rp950.000 per malam, sudah termasuk sarapan.',
		checks: ['Menanyakan lama menginap dan jumlah tamu', 'Menjelaskan tipe kamar dan harga', 'Meminta identitas untuk pendaftaran'],
		helper: 'We have a Deluxe room available. How many nights will you stay?',
		opening: "Hello, I don't have a booking. Do you have a room for tonight?", openingEmotion: 'netral'
	}),
	hotel({
		id: 'kamar-penuh', topic: 'Kedatangan', room: '305', title: 'Tipe kamar habis',
		guest: 'Mr. Olsen, tamu yang kesal',
		guestPersona: 'Mr. Olsen, an upset guest whose confirmed Garden room is not available because the hotel is overbooked.',
		context: 'Kamar Garden yang dipesan tamu habis. Hotel bisa memberi upgrade ke kamar Pool View tanpa biaya tambahan.',
		checks: ['Meminta maaf atas kesalahan hotel', 'Menjelaskan masalah dengan jujur', 'Menawarkan upgrade tanpa biaya tambahan'],
		helper: "I'm very sorry. We would like to upgrade you at no extra cost.",
		opening: 'What do you mean my room is not available? I booked it two months ago!', openingEmotion: 'marah'
	}),
	hotel({
		id: 'fasilitas', topic: 'Informasi', room: '101', title: 'Menunjukkan fasilitas',
		guest: 'Ms. Tan, tamu yang baru tiba',
		guestPersona: 'Ms. Tan, a polite guest who just arrived and wants to find the pool and the breakfast restaurant.',
		context: 'Tamu berdiri di lobby dan belum tahu letak fasilitas hotel.',
		checks: ['Menyapa tamu dengan sopan', 'Memberi arah yang jelas', 'Menawarkan bantuan lanjutan'],
		helper: 'The pool is on the second floor, next to the gym.',
		opening: 'Hi, excuse me. Where can I find the swimming pool?', openingEmotion: 'netral'
	}),
	hotel({
		id: 'wisata', topic: 'Informasi', room: '226', title: 'Rekomendasi wisata',
		guest: 'Ms. Rossi, tamu yang ingin berkeliling',
		guestPersona: 'Ms. Rossi, a cheerful guest who wants to see a Kecak dance at sunset and asks how to get there.',
		context: 'Hotel bisa mengatur mobil dan sopir ke Uluwatu seharga Rp600.000 untuk setengah hari. Tari Kecak dimulai menjelang matahari terbenam.',
		checks: ['Memberi rekomendasi tempat', 'Menjelaskan waktu berangkat', 'Menawarkan transportasi dan harganya'],
		helper: 'I recommend the Kecak dance at Uluwatu. We can arrange a driver for you.',
		opening: 'I would love to see a traditional dance. What do you recommend?', openingEmotion: 'senang'
	}),
	hotel({
		id: 'nyepi', topic: 'Informasi', room: '233', title: 'Menjelaskan Hari Nyepi',
		guest: 'Mr. Becker, tamu yang baru tahu soal Nyepi',
		guestPersona: 'Mr. Becker, a confused guest who heard that nobody can leave the hotel on Nyepi and that the airport closes.',
		context: 'Besok Hari Nyepi. Selama 24 jam tamu tetap di area hotel, bandara tutup, dan lampu perlu diredupkan. Restoran hotel tetap melayani tamu.',
		checks: ['Menjelaskan arti Nyepi secara singkat', 'Menjelaskan aturan bagi tamu', 'Memberi tahu layanan hotel yang tetap buka'],
		helper: 'Nyepi is our day of silence. Guests stay inside the hotel for one day.',
		opening: 'Someone told me we cannot go outside tomorrow. Is that true?', openingEmotion: 'bingung'
	}),
	hotel({
		id: 'pura', topic: 'Informasi', room: '240', title: 'Aturan berkunjung ke pura',
		guest: 'Ms. Lopez, tamu yang ingin ke pura',
		guestPersona: 'Ms. Lopez, a respectful guest who wants to visit a temple and asks what she should wear and do.',
		context: 'Pengunjung pura perlu memakai kain dan selendang, berpakaian sopan, dan tidak masuk area yang dibatasi. Hotel meminjamkan kain gratis.',
		checks: ['Menjelaskan pakaian yang sesuai', 'Menyebut aturan sopan santun di pura', 'Menawarkan pinjaman kain'],
		helper: 'You need to wear a sarong and a sash. We can lend you one.',
		opening: 'I want to visit a temple tomorrow. What should I wear?', openingEmotion: 'netral'
	}),
	hotel({
		id: 'antar-bandara', topic: 'Informasi', room: '252', title: 'Memesan antar ke bandara',
		guest: 'Mr. Tanaka, tamu yang akan pulang',
		guestPersona: 'Mr. Tanaka, a careful guest with a 7 pm flight who asks when to leave and how much the transfer costs.',
		context: 'Perjalanan ke bandara sekitar satu jam. Antar bandara Rp350.000 per mobil dan disarankan berangkat tiga jam sebelum penerbangan.',
		checks: ['Menanyakan jam penerbangan', 'Menyarankan waktu berangkat', 'Menyebut harga dan mengonfirmasi pesanan'],
		helper: 'What time is your flight? I suggest leaving three hours before.',
		opening: 'I need to go to the airport tomorrow. Can you arrange a car?', openingEmotion: 'netral'
	}),
	hotel({
		id: 'extra-bed', topic: 'Permintaan', room: '311', title: 'Tambahan tempat tidur',
		guest: 'Ms. Evans, ibu dengan anak kecil',
		guestPersona: 'Ms. Evans, a mother travelling with a six-year-old who needs an extra bed and asks about the cost.',
		context: 'Tempat tidur tambahan Rp200.000 per malam, sudah termasuk sarapan anak. Pemasangan butuh sekitar 30 menit.',
		checks: ['Memastikan jumlah malam', 'Menjelaskan biaya tambahan', 'Memberi tahu waktu pemasangan'],
		helper: 'An extra bed is 200,000 rupiah per night, including breakfast.',
		opening: 'Hello, my son needs his own bed. Can you add one in our room?', openingEmotion: 'netral'
	}),
	hotel({
		id: 'titip-bagasi', topic: 'Permintaan', room: '318', title: 'Menitipkan bagasi',
		guest: 'Mr. Ali, tamu yang sudah check-out',
		guestPersona: 'Mr. Ali, a guest who checked out at noon but flies at night and wants to leave two bags at the hotel.',
		context: 'Bagasi bisa dititipkan gratis di ruang penyimpanan, dan tamu menerima kartu bagasi untuk mengambilnya.',
		checks: ['Menerima permintaan dengan ramah', 'Menanyakan jumlah bagasi dan jam pengambilan', 'Menjelaskan kartu bagasi'],
		helper: 'Of course. Here is your luggage tag. Please show it when you return.',
		opening: 'My flight is at ten tonight. Can I leave my bags here?', openingEmotion: 'netral'
	}),
	hotel({
		id: 'kejutan', topic: 'Permintaan', room: '402', title: 'Kejutan ulang tahun pernikahan',
		guest: 'Mr. Costa, tamu yang merencanakan kejutan',
		guestPersona: 'Mr. Costa, an excited guest who wants to surprise his wife with flowers and a cake for their anniversary.',
		context: 'Hotel bisa menghias kamar dengan bunga seharga Rp300.000 dan menyiapkan kue Rp250.000 jika dipesan sebelum pukul 15.00.',
		checks: ['Memberi selamat kepada tamu', 'Menjelaskan pilihan dan harga', 'Memastikan waktu dan detail pesanan'],
		helper: 'Congratulations! We can prepare flowers and a cake in your room.',
		opening: "It's our wedding anniversary tomorrow. Can you help me surprise my wife?", openingEmotion: 'senang'
	}),
	hotel({
		id: 'late-checkout', topic: 'Permintaan', room: '409', title: 'Meminta late check-out',
		guest: 'Ms. Ivanova, tamu dengan penerbangan malam',
		guestPersona: 'Ms. Ivanova, a polite guest who wants to stay in the room until 4 pm because her flight is late.',
		context: 'Check-out pukul 12.00. Late check-out sampai pukul 16.00 dikenai biaya setengah harga kamar dan perlu dicek ketersediaannya.',
		checks: ['Mengecek ketersediaan kamar', 'Menjelaskan biaya tambahan', 'Memastikan jam check-out baru'],
		helper: 'Let me check availability. Late check-out is half of the room rate.',
		opening: 'Could I stay in my room until four tomorrow afternoon?', openingEmotion: 'netral'
	}),
	hotel({
		id: 'keluhan', topic: 'Keluhan', room: '307', title: 'Menangani keluhan kamar',
		guest: 'Ms. Clark, tamu yang kecewa',
		guestPersona: 'Ms. Clark, a disappointed guest who paid for a sea-view room but got a room facing the parking lot.',
		context: 'Tamu memesan pemandangan laut, tetapi kamarnya menghadap parkiran.',
		checks: ['Meminta maaf dengan tulus', 'Memastikan masalahnya', 'Memberi solusi dan waktu yang jelas'],
		helper: "I'm very sorry. Let me check your booking.",
		opening: 'I booked a sea-view room, but this one faces the parking lot.', openingEmotion: 'kesal'
	}),
	hotel({
		id: 'ac-rusak', topic: 'Keluhan', room: '415', title: 'AC kamar rusak',
		guest: 'Mr. Lee, tamu yang sudah lama menunggu',
		guestPersona: 'Mr. Lee, an angry guest whose air conditioner is broken and who has already waited an hour for a technician.',
		context: 'Teknisi bisa datang dalam 15 menit. Jika AC tidak bisa diperbaiki, tamu dapat pindah kamar.',
		checks: ['Meminta maaf atas keterlambatan', 'Memberi waktu kedatangan teknisi', 'Menawarkan pindah kamar sebagai cadangan'],
		helper: "I'm so sorry for the wait. A technician will be there in 15 minutes.",
		opening: 'I called an hour ago! Nobody came and my room is like an oven!', openingEmotion: 'marah'
	}),
	hotel({
		id: 'berisik', topic: 'Keluhan', room: '421', title: 'Kamar sebelah berisik',
		guest: 'Ms. Walker, tamu yang tidak bisa tidur',
		guestPersona: 'Ms. Walker, a tired guest who has an early tour and cannot sleep because of loud music next door at 1 am.',
		context: 'Pukul 01.00 dini hari. Petugas keamanan bisa menegur kamar sebelah, dan kamar lain di lantai atas masih kosong.',
		checks: ['Menunjukkan empati', 'Berjanji menghubungi kamar yang berisik', 'Menawarkan pindah kamar bila masih terganggu'],
		helper: "I'm sorry to hear that. I will send security to that room now.",
		opening: "It's one in the morning and the music next door is so loud.", openingEmotion: 'kesal'
	}),
	hotel({
		id: 'tagihan-minibar', topic: 'Keluhan', room: '428', title: 'Tagihan minibar keliru',
		guest: 'Mr. Murphy, tamu saat check-out',
		guestPersona: 'Mr. Murphy, an annoyed guest who sees a minibar charge on his bill but says he never used the minibar.',
		context: 'Tagihan memuat minibar Rp180.000. Resepsionis perlu menghubungi housekeeping sebelum menghapus biaya itu.',
		checks: ['Mendengarkan keluhan tanpa menyalahkan tamu', 'Mengecek catatan ke housekeeping', 'Menjelaskan koreksi tagihan'],
		helper: 'Let me check with housekeeping and correct your bill if needed.',
		opening: "There's a minibar charge on my bill, but I never opened the minibar.", openingEmotion: 'kesal'
	}),
	hotel({
		id: 'paspor-hilang', topic: 'Situasi khusus', room: '433', title: 'Paspor tamu hilang',
		guest: 'Ms. Meyer, tamu yang panik',
		guestPersona: 'Ms. Meyer, a frightened guest who cannot find her passport two days before her flight home.',
		context: 'Tamu perlu mengecek kamar dan brankas, melapor ke polisi, lalu menghubungi konsulat. Hotel bisa membantu mencarikan kontak dan mengantar.',
		checks: ['Menenangkan tamu', 'Membantu mencari di hotel lebih dulu', 'Menjelaskan langkah polisi dan konsulat'],
		helper: "Please don't worry. Let's check your room and the safe first.",
		opening: "I can't find my passport anywhere and I fly home in two days!", openingEmotion: 'sedih',
		rules: 'Do not reward promises that the passport will be found or replaced by a certain date.'
	}),
	hotel({
		id: 'tamu-sakit', topic: 'Situasi khusus', room: '437', title: 'Tamu sakit di kamar',
		guest: 'Mr. Brown, tamu yang mengkhawatirkan istrinya',
		guestPersona: 'Mr. Brown, a worried guest whose wife has a high fever and stomach pain at night.',
		context: 'Hotel punya dokter jaga yang bisa datang ke kamar dalam 30 menit, dan rumah sakit terdekat berjarak 15 menit.',
		checks: ['Menanyakan kondisi tamu dengan tenang', 'Menawarkan dokter jaga', 'Memberi pilihan ke rumah sakit bila darurat'],
		helper: 'I can call our doctor now. Is she able to walk?',
		opening: 'My wife has a high fever and bad stomach pain. What should I do?', openingEmotion: 'sedih',
		rules: 'A safe answer offers medical help. Do not reward diagnosing the illness or recommending medicine.'
	}),
	hotel({
		id: 'privasi', topic: 'Situasi khusus', room: '440', title: 'Menjaga privasi tamu',
		guest: 'Mr. Grant, pengunjung yang mencari temannya',
		guestPersona: 'Mr. Grant, a visitor who insists on getting the room number of a friend staying at the hotel.',
		context: 'Hotel tidak boleh memberi nomor kamar tamu. Resepsionis bisa menelepon kamar tamu itu dan menyambungkan bila tamu setuju.',
		checks: ['Menolak dengan sopan', 'Menjelaskan aturan privasi', 'Menawarkan menelepon tamu tersebut'],
		helper: "I'm sorry, I can't share room numbers, but I can call your friend.",
		opening: "I'm here to see my friend Anna Berg. What's her room number?", openingEmotion: 'netral',
		rules: "Never reward giving the room number or confirming private details of another guest."
	}),
	restoran({
		id: 'reservasi-meja', topic: 'Menyambut', room: '3', title: 'Menyambut tamu reservasi',
		guest: 'Ms. Green, tamu dengan reservasi',
		guestPersona: 'Ms. Green, a friendly guest arriving for a dinner reservation for four people.',
		context: 'Reservasi atas nama Green pukul 19.00 untuk empat orang. Meja yang disiapkan ada di teras.',
		checks: ['Menyambut tamu', 'Memastikan nama dan jumlah tamu', 'Mengantar ke meja dan memberi menu'],
		helper: 'Good evening, Ms. Green. Your table is ready. Please follow me.',
		opening: 'Good evening. We have a table for four under the name Green.', openingEmotion: 'senang'
	}),
	restoran({
		id: 'daftar-tunggu', topic: 'Menyambut', room: '4', title: 'Restoran sedang penuh',
		guest: 'Mr. Khan, tamu tanpa reservasi',
		guestPersona: 'Mr. Khan, a hungry guest without a reservation who asks how long the wait for a table is.',
		context: 'Semua meja terisi. Waktu tunggu sekitar 20 menit, dan tamu bisa menunggu di bar sambil melihat menu.',
		checks: ['Meminta maaf karena penuh', 'Memberi perkiraan waktu tunggu', 'Menawarkan tempat menunggu'],
		helper: "I'm sorry, we're full now. The wait is about 20 minutes.",
		opening: 'Hi, table for two, please. We are really hungry.', openingEmotion: 'netral'
	}),
	restoran({
		id: 'kursi-anak', topic: 'Menyambut', room: '5', title: 'Tamu dengan bayi',
		guest: 'Ms. Fischer, ibu dengan bayi',
		guestPersona: 'Ms. Fischer, a mother with a one-year-old who needs a high chair and asks if the kitchen can warm baby food.',
		context: 'Restoran punya kursi bayi dan dapur bisa menghangatkan makanan bayi yang dibawa tamu.',
		checks: ['Menyiapkan kursi bayi', 'Menjawab soal makanan bayi', 'Menawarkan bantuan lain'],
		helper: "Of course. I'll bring a high chair for your baby right away.",
		opening: 'Hello, do you have a high chair? And can you warm this baby food?', openingEmotion: 'netral'
	}),
	restoran({
		id: 'pindah-meja', topic: 'Menyambut', room: '6', title: 'Tamu ingin pindah meja',
		guest: 'Mr. Dubois, tamu yang kepanasan',
		guestPersona: 'Mr. Dubois, an uncomfortable guest sitting in direct sun who wants a shaded table.',
		context: 'Meja teduh baru kosong sekitar 10 menit lagi. Sementara itu tamu bisa memakai payung meja.',
		checks: ['Menanggapi dengan ramah', 'Menjelaskan meja yang tersedia', 'Memberi solusi sementara'],
		helper: 'A shaded table will be free in ten minutes. Shall I open the umbrella?',
		opening: 'Excuse me, the sun is too hot here. Can we move to another table?', openingEmotion: 'kesal'
	}),
	restoran({
		id: 'pesanan', topic: 'Memesan', room: '12', title: 'Menerima pesanan',
		guest: 'Mr. Reed, tamu makan malam',
		guestPersona: 'Mr. Reed, a dinner guest who wants a recommendation and asks whether the dish is spicy.',
		context: 'Tamu sudah membaca menu dan siap memesan.',
		checks: ['Menyapa tamu', 'Memberi rekomendasi menu', 'Mengulang pesanan dengan benar'],
		helper: 'I recommend our grilled fish with sambal.',
		opening: "Hi, we're ready to order. What do you recommend?", openingEmotion: 'senang'
	}),
	restoran({
		id: 'menu-bali', topic: 'Memesan', room: '14', title: 'Menjelaskan menu Bali',
		guest: 'Ms. Andersson, tamu yang ingin mencoba masakan Bali',
		guestPersona: 'Ms. Andersson, a curious guest who does not know what bebek betutu and sate lilit are.',
		context: 'Bebek betutu adalah bebek berbumbu yang dimasak lama. Sate lilit adalah daging ikan cincang berbumbu yang dililit pada batang serai.',
		checks: ['Menjelaskan bahan utama', 'Menjelaskan rasa atau cara masak', 'Memberi rekomendasi'],
		helper: 'Bebek betutu is slow-cooked duck with Balinese spices.',
		opening: "I'd like to try Balinese food. What is bebek betutu?", openingEmotion: 'bingung'
	}),
	restoran({
		id: 'minuman', topic: 'Memesan', room: '16', title: 'Merekomendasikan minuman',
		guest: 'Mr. Santos, tamu yang tidak minum alkohol',
		guestPersona: 'Mr. Santos, a guest who wants a refreshing drink without alcohol to go with his meal.',
		context: 'Tersedia es kelapa muda, jus markisa, dan loloh cemcem, minuman daun khas Bali.',
		checks: ['Menanyakan selera tamu', 'Merekomendasikan minuman tanpa alkohol', 'Mengulang pesanan minuman'],
		helper: 'I recommend our young coconut. It is fresh and has no alcohol.',
		opening: "I don't drink alcohol. Do you have something fresh and local?", openingEmotion: 'netral'
	}),
	restoran({
		id: 'level-pedas', topic: 'Memesan', room: '17', title: 'Mengatur tingkat pedas',
		guest: 'Ms. Wright, tamu yang tidak tahan pedas',
		guestPersona: 'Ms. Wright, a nervous guest who wants ayam betutu but cannot eat very spicy food.',
		context: 'Dapur bisa mengurangi cabai dan menyajikan sambal di piring terpisah.',
		checks: ['Menjelaskan tingkat pedas', 'Menawarkan sambal terpisah', 'Mengulang permintaan untuk dapur'],
		helper: 'We can make it mild and serve the sambal on the side.',
		opening: 'Is this chicken very spicy? I really cannot eat spicy food.', openingEmotion: 'bingung'
	}),
	restoran({
		id: 'rombongan', topic: 'Memesan', room: '18', title: 'Melayani rombongan',
		guest: 'Mr. Nguyen, pemimpin rombongan',
		guestPersona: 'Mr. Nguyen, a tour leader ordering for ten people who wants shared dishes and asks for a set menu.',
		context: 'Paket rombongan Rp150.000 per orang, berisi nasi, tiga lauk, sayur, dan buah. Waktu siap sekitar 25 menit.',
		checks: ['Menjelaskan isi paket', 'Menyebut harga dan waktu siap', 'Memastikan jumlah orang dan pantangan makanan'],
		helper: 'Our group menu is 150,000 rupiah per person. Any food restrictions?',
		opening: 'There are ten of us and we are on a tight schedule. What can you offer?', openingEmotion: 'netral'
	}),
	restoran({
		id: 'alergi', topic: 'Pantangan makanan', room: '7', title: 'Menjawab soal alergi',
		guest: 'Ms. Patel, tamu dengan alergi kacang',
		guestPersona: 'Ms. Patel, a worried guest with a peanut allergy who needs the kitchen to confirm the ingredients.',
		context: 'Tamu ingin memastikan makanan aman sebelum memesan.',
		checks: ['Menanggapi alergi dengan serius', 'Tidak menjanjikan makanan aman sebelum dicek', 'Memastikan ke dapur dan menawarkan pilihan lain'],
		helper: 'Let me confirm with the kitchen first.',
		opening: 'Excuse me, I have a peanut allergy. Is the satay safe for me?', openingEmotion: 'sedih',
		rules: KITCHEN_RULE
	}),
	restoran({
		id: 'halal', topic: 'Pantangan makanan', room: '8', title: 'Menjawab soal halal',
		guest: 'Ms. Rahman, tamu muslim',
		guestPersona: 'Ms. Rahman, a Muslim guest who asks whether the food is halal and whether pork is used in the kitchen.',
		context: 'Restoran belum bersertifikat halal dan menyajikan babi guling. Dapur bisa menjelaskan menu tanpa babi dan cara memasaknya.',
		checks: ['Menjawab dengan jujur', 'Tidak mengklaim halal tanpa dasar', 'Menawarkan pengecekan ke dapur dan pilihan menu'],
		helper: 'We are not halal certified. Let me ask the kitchen about pork-free dishes.',
		opening: 'Is the food here halal? Do you use pork in the kitchen?', openingEmotion: 'netral',
		rules: 'Do not reward claiming that food is halal. An honest answer says the restaurant is not certified and serves pork.'
	}),
	restoran({
		id: 'vegan', topic: 'Pantangan makanan', room: '9', title: 'Melayani tamu vegan',
		guest: 'Ms. Jensen, tamu vegan',
		guestPersona: 'Ms. Jensen, a vegan guest who worries that shrimp paste and egg are hidden in Balinese dishes.',
		context: 'Sambal dan bumbu sering memakai terasi. Dapur bisa membuat gado-gado dan sayur urap tanpa terasi dan telur.',
		checks: ['Memastikan pantangan tamu', 'Memeriksa bahan ke dapur', 'Menawarkan menu yang bisa disesuaikan'],
		helper: 'Let me check the sauce with the kitchen. It may contain shrimp paste.',
		opening: "I'm vegan. Is there shrimp paste or egg in the gado-gado?", openingEmotion: 'netral',
		rules: KITCHEN_RULE
	}),
	restoran({
		id: 'gluten', topic: 'Pantangan makanan', room: '10', title: 'Tamu tidak bisa makan gluten',
		guest: 'Mr. Hughes, tamu dengan penyakit celiac',
		guestPersona: 'Mr. Hughes, a careful guest with celiac disease who asks if soy sauce contains gluten.',
		context: 'Kecap dan beberapa saus mungkin mengandung gandum. Dapur perlu memastikan bahan dan alat masaknya.',
		checks: ['Menanggapi dengan serius', 'Memastikan bahan dan alat masak ke dapur', 'Menawarkan pilihan lain'],
		helper: 'Let me ask the chef about the sauce and the cooking tools.',
		opening: 'I have celiac disease. Is there any gluten in the fried rice?', openingEmotion: 'sedih',
		rules: KITCHEN_RULE
	}),
	restoran({
		id: 'tamu-hamil', topic: 'Pantangan makanan', room: '11', title: 'Tamu sedang hamil',
		guest: 'Ms. Okafor, tamu yang sedang hamil',
		guestPersona: 'Ms. Okafor, a pregnant guest who wants to know if the fish is fully cooked and avoids raw food.',
		context: 'Tuna di menu disajikan setengah matang. Dapur bisa memasaknya sampai matang penuh jika diminta.',
		checks: ['Menanyakan kebutuhan tamu', 'Menjelaskan tingkat kematangan', 'Menawarkan masakan matang penuh'],
		helper: 'The tuna is medium rare, but the chef can cook it through.',
		opening: "I'm pregnant, so I can't eat raw food. Is the tuna fully cooked?", openingEmotion: 'netral',
		rules: KITCHEN_RULE
	}),
	restoran({
		id: 'terlambat', topic: 'Keluhan', room: '15', title: 'Menangani pesanan terlambat',
		guest: 'Mr. Silva, tamu yang terburu-buru',
		guestPersona: 'Mr. Silva, a guest in a hurry to catch a flight whose food has not arrived after thirty minutes.',
		context: 'Makanan belum datang, dan tamu harus segera ke bandara.',
		checks: ['Meminta maaf', 'Mengecek status pesanan', 'Memberi perkiraan waktu dan solusi'],
		helper: "I'm very sorry. Let me check your order now.",
		opening: "We ordered thirty minutes ago and our food still isn't here.", openingEmotion: 'kesal'
	}),
	restoran({
		id: 'salah-pesanan', topic: 'Keluhan', room: '19', title: 'Pesanan yang datang salah',
		guest: 'Ms. Bennett, tamu yang menerima menu lain',
		guestPersona: 'Ms. Bennett, an annoyed guest who ordered grilled fish but received fried chicken.',
		context: 'Dapur bisa membuat ikan bakar baru dalam 15 menit, dan pesanan yang salah tidak ditagihkan.',
		checks: ['Meminta maaf', 'Mengganti pesanan dengan cepat', 'Memberi tahu waktu tunggu'],
		helper: "I'm so sorry. I'll bring your grilled fish in 15 minutes.",
		opening: 'This is not what I ordered. I asked for the grilled fish.', openingEmotion: 'kesal'
	}),
	restoran({
		id: 'makanan-dingin', topic: 'Keluhan', room: '20', title: 'Makanan sudah dingin',
		guest: 'Mr. Weber, tamu yang kecewa',
		guestPersona: 'Mr. Weber, a disappointed guest whose soup and rice arrived cold.',
		context: 'Dapur bisa menyiapkan porsi baru dalam 10 menit.',
		checks: ['Meminta maaf', 'Menawarkan porsi baru', 'Memberi tahu waktu penggantian'],
		helper: "I apologize. I'll ask the kitchen to prepare a fresh one for you.",
		opening: 'Excuse me, my soup is cold and so is the rice.', openingEmotion: 'kesal'
	}),
	restoran({
		id: 'rambut', topic: 'Keluhan', room: '21', title: 'Ada rambut di makanan',
		guest: 'Ms. Taylor, tamu yang marah',
		guestPersona: 'Ms. Taylor, a furious guest who found a hair in her noodles and wants to speak to someone responsible.',
		context: 'Pramusaji perlu mengangkat piring, memanggil manajer, dan menawarkan pengganti. Hidangan itu tidak ditagihkan.',
		checks: ['Meminta maaf tanpa membela diri', 'Mengangkat makanan dan menawarkan pengganti', 'Memanggil manajer'],
		helper: "I'm terribly sorry. I'll take this away and call my manager.",
		opening: 'There is a hair in my noodles! This is disgusting!', openingEmotion: 'marah'
	}),
	restoran({
		id: 'pisah-tagihan', topic: 'Pembayaran', room: '22', title: 'Memisahkan tagihan',
		guest: 'Mr. Hall, tamu yang makan bersama teman',
		guestPersona: 'Mr. Hall, a friendly guest who wants to split the bill three ways and asks what the service charge is.',
		context: 'Tagihan bisa dibagi per orang atau per menu. Harga sudah ditambah pajak 10% dan layanan 5%.',
		checks: ['Menanyakan cara membagi tagihan', 'Menjelaskan pajak dan layanan', 'Mengonfirmasi cara bayar'],
		helper: 'Would you like to split it equally or by item?',
		opening: 'Can we split the bill three ways, please? What is this extra charge?', openingEmotion: 'netral'
	}),
	restoran({
		id: 'kartu-ditolak', topic: 'Pembayaran', room: '23', title: 'Kartu tamu ditolak',
		guest: 'Ms. Moreau, tamu yang malu',
		guestPersona: 'Ms. Moreau, an embarrassed guest whose credit card was declined and who has little cash with her.',
		context: 'Restoran menerima kartu lain, QRIS, dan tunai. ATM terdekat berjarak dua menit berjalan kaki.',
		checks: ['Menyampaikan dengan sopan dan pelan', 'Menawarkan cara bayar lain', 'Memberi arah ke ATM'],
		helper: 'The machine did not accept this card. Would you like to try another?',
		opening: 'Oh no, my card was declined? That has never happened before.', openingEmotion: 'sedih'
	})
];

export const findScenario = (id: string) => scenarios.find((item) => item.id === id);
