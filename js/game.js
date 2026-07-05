// =========================================
// OYUN MOTORU VE YARDIMCILAR
// =========================================

const gameState = {
    currentScene: null, // Şu an aktif olan sahne objesi
    keys: {},
};

// Tuş dinleyicileri
document.addEventListener('keydown', (e) => gameState.keys[e.code] = true);
document.addEventListener('keyup', (e) => gameState.keys[e.code] = false);

// UI Yardımcısı
const UIManager = {
    setDate: function(dateText) {
        document.getElementById('date-display').innerText = dateText;
    }
};

// Geçiş (Transition) Yöneticisi
const TransitionManager = {
    screen: document.getElementById('transition-screen'),
    textElement: document.getElementById('transition-text'),

    fadeIn: function(text, onComplete) {
        this.textElement.innerText = text;
        this.textElement.style.opacity = 1;
        this.screen.classList.add('active');
        setTimeout(() => { if (onComplete) onComplete(); }, 1500);
    },
    fadeOut: function(onComplete) {
        this.screen.classList.remove('active');
        setTimeout(() => {
            this.textElement.innerText = "";
            if (onComplete) onComplete();
        }, 1500);
    },
    changeText: async function(newText, duration) {
        this.textElement.style.opacity = 0;
        await new Promise(resolve => setTimeout(resolve, 500));
        this.textElement.innerText = newText;
        this.textElement.style.opacity = 1;
        await new Promise(resolve => setTimeout(resolve, duration || 2000));
    }
};

// Sahne Yöneticisi (Yeni!)
const SceneManager = {
    activeScene: null,
    
    load: function(sceneObject) {
        // Eski sahne varsa temizle (gerekirse)
        this.activeScene = sceneObject;
        sceneObject.init(); // Yeni sahneyi başlat
    },

    // Ana oyun döngüsü tarafından sürekli çağrılır
    update: function() {
        if (this.activeScene && this.activeScene.update) {
            this.activeScene.update();
        }
    }
};

// =========================================
// SAHNELER
// =========================================

// --- SAHNE 1: TANIŞMA ---
const Scene1 = {
    init: function() {
        console.log("Sahne 1 Başladı");
        UIManager.setDate("13 KASIM 2024");
        
        // Elementleri al
        this.umut = document.getElementById('umut-can');
        this.deniz = document.getElementById('deniz');
        this.bg = document.getElementById('scene-area');

        // Başlangıç durumları
        this.umutLeft = 50;
        this.bgPos = 0;
        this.walkedDistance = 0;
        this.isMeeting = false;

        // Görselleri sıfırla
        this.bg.style.backgroundImage = "url('assets/images/bg_yuruyus.png')";
        this.umut.style.display = 'block';
        this.deniz.style.display = 'none';
        this.updateVisuals();
    },

    update: function() {
        if (this.isMeeting) return; // Buluşma başladıysa update'i durdur

        // Yürüme mantığı
        if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) {
            if (this.umutLeft < 350) {
                this.umutLeft += 5;
            } else {
                this.bgPos -= 3;
                this.walkedDistance += 3;
            }
            this.updateVisuals();
        }

        // Buluşma kontrolü (Örn: 2000px yürüdükten sonra)
        if (this.walkedDistance > 2000 && !this.isMeeting) {
            this.startMeeting();
        }
    },

    updateVisuals: function() {
        this.umut.style.left = this.umutLeft + "px";
        this.bg.style.backgroundPositionX = this.bgPos + "px";
    },

    startMeeting: function() {
        this.isMeeting = true;
        // Arka planı değiştir
        this.bg.style.backgroundImage = "url('assets/images/bg_bulusma.png')";
        this.bg.style.backgroundPositionX = "0px";
        
        // Deniz girsin
        this.deniz.style.display = 'block';
        this.deniz.style.right = "-150px"; // Önce dışarı al
        setTimeout(() => {
            this.deniz.style.transition = "right 2s ease-out";
            this.deniz.style.right = "100px";
            
            // Deniz girdikten sonra mesajı göster
            setTimeout(() => {
                showMessage("13 Kasım'da gördüm seni ilk Mugi'de. O zaman 24 yıllık hayatımı bir yapboz olarak düşünürsek, o yapbozu ben yapıyorum, yapıyorum, bitiriyorum; bir tane parça yok, eksik, bulunmuyor. Kafayı yersin! O parçayı bulamazsan o yapboz bitmiyor ya! O ufacık parça, senin yapbozunun en değerli parçası aslında. Benim hayatım bir yapbozsa, sen benim yapbozumun en değerli, en büyük parçası oldun o gün");
                
                // Mesaj okunduktan sonra sahne sonu geçişi başlat (10 saniye sonra)
                setTimeout(() => {
                    hideMessage();
                    TransitionManager.fadeIn("BÖLÜM 1 BİTTİ", async () => {
                        await new Promise(r => setTimeout(r, 1000));
                        await TransitionManager.changeText("2 GÜN SONRA...", 2000);
                        
                        // --> SAHNE 2'YE GEÇİŞ BURADA YAPILIYOR <--
                        SceneManager.load(Scene2);
                        
                        TransitionManager.fadeOut();
                    });
                }, 10000);
            }, 2000);
        }, 50);
    }
};

// --- SAHNE 2: KOVALAMACA ---
const Scene2 = {
    init: function() {
        console.log("Sahne 2 Başladı");
        UIManager.setDate("15 KASIM 2025");

        this.umut = document.getElementById('umut-can');
        this.deniz = document.getElementById('deniz');
        this.bg = document.getElementById('scene-area');

        // --- AŞAMA 1: BEKLEME (Buluşma yerinde) ---
        this.phase = 'waiting'; // waiting -> chasing -> caught
        this.timer = 0;

        // Başlangıç görselleri
        this.bg.style.backgroundImage = "url('assets/images/bg_bulusma.png')";
        this.bg.style.backgroundPositionX = "0px";
        this.bgPos = 0;

        // Deniz sağda bekliyor
        this.deniz.style.display = "block";
        this.deniz.style.right = "100px"; 

        // Umut henüz ortada yok
        this.umut.style.left = "-150px";
        this.umutPos = -150;
    },

    update: function() {
        // Hangi aşamadayız?
        
        // AŞAMA 1: BEKLEME (2 saniye kadar buluşma yerini göster)
        if (this.phase === 'waiting') {
            this.timer++;
            if (this.timer > 120) { // ~2 saniye sonra
                this.startChase();
            }
        }

        // AŞAMA 2: KOVALAMACA (Yürüyüş yolunda)
        else if (this.phase === 'chasing') {
            // 1. Arka planı YAVAŞÇA kaydır (Hız: 1.5)
            this.bgPos -= 1.5; 
            this.bg.style.backgroundPositionX = this.bgPos + "px";

            // 2. Umut YAVAŞÇA sahneye girsin ve ilerlesin (Hız: 2.0)
            // Arka plandan sadece 0.5 birim daha hızlı, yani yakalaması uzun sürecek.
            this.umutPos += 2.0;
            this.umut.style.left = this.umutPos + "px";

            // 3. Yakalama kontrolü (480px noktasına gelince)
            if (this.umutPos >= 480) { 
                this.catchDeniz();
            }
        }
        // AŞAMA 3: YAKALANDI (caught) durumunda hiçbir şey yapmıyoruz, her şey duruyor.
    },

    startChase: function() {
        console.log("Kovalamaca başladı!");
        this.phase = 'chasing';
        // Arka planı yürüyüş yoluna çevir ki kaydığında sırııtmasın
        this.bg.style.backgroundImage = "url('assets/images/bg_yuruyus.png')";
    },

    catchDeniz: function() {
        console.log("Deniz yakalandı!");
        this.phase = 'caught';
        
        // Karakterleri tam pozisyonlarına sabitle
        this.umutPos = 480;
        this.umut.style.left = "480px";

        // Arka planı final görseli yap ve durdur
        this.bg.style.backgroundImage = "url('assets/images/bg_yakalama.png')";
        this.bg.style.backgroundPositionX = "0px";

        // Bölüm sonu mesajı
        TransitionManager.fadeIn("DENİZ'İ YAKALADIN!", async () => {
     await TransitionManager.changeText("ERTESİ GÜN...", 2000);
     
     // Sahne 3'ü yükle
     SceneManager.load(Scene3);
     
     TransitionManager.fadeOut();
        });
    }
};
const Scene3 = {
    init: function() {
        console.log("Sahne 3 Başladı");
        UIManager.setDate("16 KASIM 2025");

        this.umut = document.getElementById('umut-can');
        this.deniz = document.getElementById('deniz');
        this.bg = document.getElementById('scene-area');

        // Arka plan sabit
        this.bg.style.backgroundImage = "url('assets/images/bg_yuruyus.png')";
        this.bg.style.backgroundPositionX = "0px";

        // --- ADIM 1: UMUT SAHNEDE ---
        this.deniz.style.display = 'none'; // Deniz henüz yok
        
        this.umut.src = "assets/images/umut_telefon.png";
        this.umut.style.left = "350px"; // Ortala
        this.umut.style.display = 'block';

        // 1.5 saniye sonra Umut'un mesajı
        setTimeout(() => {
            showMessage("İşten çıkınca işin varmı?,\nDün çay ismarlim dedin işim var diye kabul edemedim ben ısmarlim sana.");

            // --- ADIM 2: SIRA DENİZ'E GEÇİYOR (4 saniye sonra) ---
            setTimeout(() => {
                // Mesajı ve Umut'u gizle
                hideMessage();
                this.umut.style.display = 'none';

                // Deniz'i sahneye al
                this.deniz.src = "assets/images/deniz_telefon.png";
                this.deniz.style.left = "365px"; // Deniz de ortada dursun
                this.deniz.style.display = 'block';

                // 1 saniye sonra Deniz'in cevabı
                setTimeout(() => {
                    showMessage("İşim yok, Olabilir olur yani");

                    // --- ADIM 3: SAHNE SONU ---
                    // 3 saniye sonra bu sahneyi bitirelim
                    setTimeout(() => {
                        TransitionManager.fadeIn("BULUŞMA VAKTİ...", async () => {
                            hideMessage();
                             await TransitionManager.changeText("AYNI GÜN\nAKŞAMÜSTÜ...", 2500);
                             // Buraya bir sonraki sahne (Scene4) gelecek
                             console.log("Sahne 4'e geçilmeye hazır!");
                             SceneManager.load(Scene4);
                             TransitionManager.fadeOut();
                        });
                    }, 3000);

                }, 1000); // Deniz geldikten 1sn sonra mesajı çıksın

            }, 5000); // Umut'un mesajı 5sn ekranda kalsın

        }, 1500); // Sahne açıldıktan 1.5sn sonra ilk mesaj
    },

    update: function() {}
};
const Scene4 = {
    init: function() {
        hideMessage();
        console.log("Sahne 4 Başladı");
        UIManager.setDate("16 KASIM - AKŞAMÜSTÜ");

        this.umut = document.getElementById('umut-can');
        this.deniz = document.getElementById('deniz');
        this.bg = document.getElementById('scene-area');
        this.coffeeItem = document.getElementById('coffee-item');
        this.coffeeCounterUI = document.getElementById('coffee-counter');
        this.coffeeCountSpan = document.getElementById('coffee-count');

        // Hazırlık
        this.bg.style.backgroundImage = "url('assets/images/bg_yol_kahve.png')";
        this.bgPos = 0;
        
        this.umut.src = "assets/images/umut_can.png"; // Normal yürüyüş haliyle başla
        this.umut.style.display = 'block';
        this.umut.style.left = "50px";
        this.umutLeft = 50;

        this.deniz.style.display = 'none';

        // Kahve sistemi başlat
        this.coffeesCollected = 0;
        this.coffeeCounterUI.style.display = 'block';
        this.updateCoffeeUI();
        
        this.coffeeSpawnTimer = 0;
        this.isCoffeeOnScreen = false; // Ekranda aynı anda sadece 1 kahve olsun (basitlik için)

        this.gameActive = true;
    },

    update: function() {
        if (!this.gameActive) return;

        // --- YÜRÜME MANTIĞI ---
        if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) {
            // Umut ortaya kadar yürüsün
            if (this.umutLeft < 350) {
                this.umutLeft += 5;
                this.umut.style.left = this.umutLeft + "px";
            } else {
                // Sonra arka plan kaysın
                this.bgPos -= 5;
                this.bg.style.backgroundPositionX = this.bgPos + "px";
                
                // Kahve de arka planla birlikte sola kaysın (eğer ekrandaysa)
                if (this.isCoffeeOnScreen) {
                    this.coffeeLeft -= 5;
                    this.coffeeItem.style.left = this.coffeeLeft + "px";
                }
            }

            // --- KAHVE ÇIKARMA MANTIĞI ---
            // Yürüdükçe sayaç artsın, belli aralıklarla kahve çıksın
            this.coffeeSpawnTimer++;
            if (!this.isCoffeeOnScreen && this.coffeeSpawnTimer > 150) { // Her ~150 karede bir (yürürsen)
                this.spawnCoffee();
                this.coffeeSpawnTimer = 0;
            }
        }

        // --- ÇARPIŞMA KONTROLÜ ---
        if (this.isCoffeeOnScreen) {
            // Eğer kahve ekranın solundan çıkarsa kaybolsun
            if (this.coffeeLeft < -50) {
                this.isCoffeeOnScreen = false;
                this.coffeeItem.style.display = 'none';
            }
            
            // Umut kahveye değdi mi? (Basit mesafe kontrolü)
            // Umut'un merkezi ile kahvenin merkezi yakın mı?
            if (Math.abs(this.umutLeft - this.coffeeLeft) < 50) {
                this.collectCoffee();
            }
        }
    },

    spawnCoffee: function() {
        this.isCoffeeOnScreen = true;
        this.coffeeLeft = 850; // Ekranın sağından girsin (800px + biraz dışarı)
        this.coffeeItem.style.left = this.coffeeLeft + "px";
        this.coffeeItem.style.bottom = "50px"; // Yerden yüksekliği (zıplayarak alınacaksa daha yüksek olabilir)
        this.coffeeItem.style.display = 'block';
    },

    collectCoffee: function() {
        console.log("Kahve toplandı!");
        this.isCoffeeOnScreen = false;
        this.coffeeItem.style.display = 'none';
        
        this.coffeesCollected++;
        this.updateCoffeeUI();

        // HEDEF KONTROLÜ: 3 Kahve
        if (this.coffeesCollected >= 15) {
            this.finishScene();
        }
    },

    updateCoffeeUI: function() {
        this.coffeeCountSpan.innerText = this.coffeesCollected;
    },

    finishScene: function() {
        this.gameActive = false;
        console.log("Bölüm Bitti, Bau'nun oraya gidiliyor...");

        TransitionManager.fadeIn("BAU'NUN ORAYA VARIŞ...", async () => {
            // 1. UI Temizliği
            this.coffeeCounterUI.style.display = 'none';
            
            // 2. Sahne Hazırlığı (Bau Önü)
            this.bg.style.backgroundImage = "url('assets/images/bg_cafe_on.png')";
            this.bg.style.backgroundPositionX = "0px";
            
            // Karakterler Bau önünde duruyor
            this.umut.src = "assets/images/umut_kahve.png";
            this.umut.style.left = "300px";
            
            this.deniz.src = "assets/images/deniz_kahve.png";
            this.deniz.style.display = 'block';
            this.deniz.style.left = "450px"; 

            // 3. Sahne Açılıyor
            await TransitionManager.fadeOut();

            // 4. Veda Diyaloğu
            setTimeout(() => {
                // Umut konuşur Bau'dan ayrılırken söyleeyceğim şeyi yaz
                showMessage("Umut: Sohbet Çok İyidi Bunu Tekrarlayalım.\nSeni yurduna bırakayım artık.");
                
                setTimeout(() => {
                    // Denizin cevabını yaz
                    showMessage("Deniz: Olurr.");
                    
                    setTimeout(() => {
            hideMessage();
            // Sahne 5'e (İtiraf anına) geçiş
             TransitionManager.fadeIn("VE O ÖZEL GÜN...", async () => {
             SceneManager.load(Scene5);
             TransitionManager.fadeOut();
    });
}, 3000);

                }, 3500); // Umut'un mesajı 3.5sn kalsın

            }, 1000); // Sahne açıldıktan 1sn sonra konuşma başlasın
        });
    }
    
};
const Scene5 = {
    init: function() {
        console.log("Sahne 5 (İtiraf) Başladı");
        // BURAYA Yurda gittiğiniz zanabı yaz
        UIManager.setDate("20 KASIMN 2024"); 

        this.umut = document.getElementById('umut-can');
        this.deniz = document.getElementById('deniz');
        this.bg = document.getElementById('scene-area');

        // Önceki sahneden kalan karakterleri tamamen gizle
        this.umut.style.display = 'none';
        this.deniz.style.display = 'none';

        // Arka planı ayarla (karakterler arka plan görselinde var)
        this.bg.style.backgroundImage = "url('assets/images/bg_park.png')";
        this.bgPos = 0;

            setTimeout(() => {
            //Yurt önünde ne dediğini yaz
             showMessage("Umut: Bir Anda Dönüp\nBenim İle Çıkarmısın?");
             
             setTimeout(() => {
                //Yurt önünde DEnizin cevabı yaz
                 showMessage("Deniz: Immmm Evet");

                 // 3. Final Sahnesine (Yıl dönümü) geçiş
                 setTimeout(() => {
                     hideMessage();
                     TransitionManager.fadeIn("TAM 1 YIL SONRA...", async () => {
                          SceneManager.load(Scene6); // Final sahnesi artık Scene6 oldu
                          TransitionManager.fadeOut();
                     });
                 }, 3000);

             }, 3000);
        }, 1500);
    },

    update: function() {}
};
// SAHNE 6: BÜYÜK FİNAL (YIL DÖNÜMÜ)
// =========================================
const Scene6 = {
    init: function() {
        console.log("Final Sahnesi Başladı");
        // BURAYA ÖZEL TARİHİ YAZ:
        UIManager.setDate("20 Kasım 2025"); 

        this.umut = document.getElementById('umut-can');
        this.deniz = document.getElementById('deniz');
        this.bg = document.getElementById('scene-area');
        this.finalText = document.getElementById('final-celebration');

        // 1. Sahne Hazırlığı
        this.bg.style.backgroundImage = "url('assets/images/bg_final.png')";
        this.bg.style.backgroundPositionX = "0px";

        // Karakterler merkezde yan yana
        this.umut.src = "assets/images/umut_ask.png";
        this.umut.style.left = "320px";
        this.umut.style.display = 'block';

        this.deniz.src = "assets/images/deniz_ask.png";
        this.deniz.style.left = "420px";
        this.deniz.style.display = 'block';

        const self = this;

        // 2. Mesajları sırayla göster
        setTimeout(function() {
            const messages = [
                "16 kasım'da, Caffe Co'dan kahvelerimizi alırken yaşanan o tatlı telaş... Bizi yakalayan sadece Onur Abi ve Efe değildi; sanki kaderin ta kendisiydi.",
                "Göz göze gelip oturduğumuzda, fısıltılarla başlayan sohbetimiz, ruhlarımızın ne kadar benzer olduğunu ortaya çıkardı. Farklı bedenlerde, farklı hikâyeler yaşamış olsak da, o an anladım: Hayatlarımızın ritmi, aynı kalpte atıyordu.",
                "İşte o anda, görünmez, incecik ve parlak bir bağ hissettim. Tıpkı uzak doğu efsanelerindeki gibi... Farklı yaşantılar içinde, kırmızı bir iple birbirine sımsıkı bağlanmış iki kaderin hikâyesiydi bu.",
                "O an, tüm şüphelerim dağıldı. Sen benim yolumun sonu, arayışımın cevabıydın. O günden beri biliyorum: Sen, benim kaderim oldun",
                "Nice Güzel Yıllarımıza\nSeni seviyorum ❤️"
            ];

            // Her mesaj için farklı okuma süreleri (milisaniye cinsinden)
            const messageDurations = [
                8000,  // İlk mesaj: Caffe Co anısı
                10000, // İkinci mesaj: Sohbet ve ritim
                9000,  // Üçüncü mesaj: Kırmızı ip metaforu
                7000,  // Dördüncü mesaj: Kader cümlesi
                6000   // Final mesajı: Nice yıllara
            ];

            let currentMessage = 0;
            function showNextMessage() {
                if (currentMessage < messages.length) {
                    showMessage(messages[currentMessage]);
                    currentMessage++;
                    setTimeout(showNextMessage, messageDurations[currentMessage - 1]);
                } else {
                    setTimeout(function() {
                        hideMessage();
                        self.finalText.classList.add('show');
                    }, 4000);
                }
            }
            
            showNextMessage();
        }, 1500);
    },

    update: function() {
        // Final sahnesi durağan.
    }
};      

// =========================================
// OYUN DÖNGÜSÜ (GAME LOOP)
// =========================================
function gameLoop() {
    SceneManager.update();
    requestAnimationFrame(gameLoop);
}
function showMessage(text) {
    const msgBox = document.getElementById('message-box');
    const msgText = document.getElementById('message-text');
    msgBox.style.display = 'block';
    msgText.innerText = text;
}
function hideMessage() {
    document.getElementById('message-box').style.display = 'none';
}

// =========================================
// MOBİL UYUMLULUK: ÖLÇEKLEME
// =========================================
// Oyun sabit 800x450 piksel üzerinden tasarlandığı için tüm konum
// hesaplamaları (this.umutLeft, bgPos vb.) bu iç çözünürlüğe göre yapılıyor.
// Bunu değiştirmek yerine, dış kutuyu (#game-container) ekrana göre
// transform: scale() ile küçültüp/büyütüyoruz. Böylece iPhone dahil her
// ekran boyutunda oran bozulmadan, kod mantığına dokunmadan sığdırılıyor.
function resizeGame() {
    const wrapper = document.getElementById('viewport-wrapper');
    const container = document.getElementById('game-container');
    if (!wrapper || !container) return;

    const availW = wrapper.clientWidth;
    const availH = wrapper.clientHeight;

    const scale = Math.min(availW / 800, availH / 450);
    container.style.transform = `scale(${scale})`;
}

// =========================================
// MOBİL UYUMLULUK: DOKUNMATİK KONTROLLER
// =========================================
// Oyun klavyeyle (ArrowRight / D) kontrol edildiği için, klavyesi olmayan
// telefonlarda oynanamıyordu. Bu buton basılı tutulduğu sürece
// gameState.keys['ArrowRight'] = true yaparak klavye tuşunu simüle ediyor.
function setupTouchControls() {
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const controls = document.getElementById('touch-controls');
    const btnRight = document.getElementById('btn-right');
    if (!controls || !btnRight) return;

    if (isTouchDevice) {
        controls.style.display = 'block';
    }

    const press = (e) => {
        e.preventDefault();
        gameState.keys['ArrowRight'] = true;
        btnRight.classList.add('pressed');
    };
    const release = (e) => {
        e.preventDefault();
        gameState.keys['ArrowRight'] = false;
        btnRight.classList.remove('pressed');
    };

    btnRight.addEventListener('touchstart', press, { passive: false });
    btnRight.addEventListener('touchend', release, { passive: false });
    btnRight.addEventListener('touchcancel', release, { passive: false });
    // Masaüstünde fare ile test edilebilmesi için:
    btnRight.addEventListener('mousedown', press);
    btnRight.addEventListener('mouseup', release);
    btnRight.addEventListener('mouseleave', release);
}

// =========================================
// MOBİL UYUMLULUK: YATAY ÇEVİRME İPUCU
// =========================================
function setupRotateHint() {
    const hint = document.getElementById('rotate-hint');
    if (!hint) return;

    function check() {
        const isCoarse = window.matchMedia('(pointer: coarse)').matches;
        const isPortrait = window.innerHeight > window.innerWidth;
        if (isCoarse && isPortrait) {
            hint.classList.add('show');
        } else {
            hint.classList.remove('show');
        }
    }

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', () => setTimeout(check, 300));
}

// =========================================
// MOBİL UYUMLULUK: PINCH-ZOOM ENGELLEME (iOS Safari)
// =========================================
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// Oyunu Başlat
window.onload = function() {
    resizeGame();
    setupTouchControls();
    setupRotateHint();

    window.addEventListener('resize', resizeGame);
    window.addEventListener('orientationchange', () => setTimeout(resizeGame, 300));

    SceneManager.load(Scene1); // İlk sahneyle başla
    gameLoop();
};