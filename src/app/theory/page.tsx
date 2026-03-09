
"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  ChevronRight, 
  Calculator, 
  Languages, 
  Atom, 
  FlaskConical, 
  Globe, 
  Dna,
  Scale,
  ListChecks,
  Terminal,
  BookText,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Trophy,
  ArrowRight,
  XCircle,
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { generateUntQuestions } from "@/ai/flows/run-unt-test-flow";
import { updateUserRating } from "@/lib/rating";

// Static test data for "Тас дәуірі"
const STATIC_TESTS: Record<string, Record<string, any[]>> = {
  "Қазақстан тарихы": {
    "Тас дәуірі": [
      { id: "1", text: "Адамзат тарихындағы ең ұзаққа созылған кезең:", options: ["Қола дәуірі", "Темір дәуірі", "Тас дәуірі", "Орта ғасыр"], correctAnswer: "C", explanation: "Тас дәуірі адамзат тарихының 99%-ын қамтитын ең ұзақ кезең." },
      { id: "2", text: "Ежелгі тас ғасыры қалай аталады?", options: ["Мезолит", "Неолит", "Палеолит", "Энеолит"], correctAnswer: "C", explanation: "Палеолит - грек тілінен аударғанда 'ежелгі тас' дегенді білдіреді." },
      { id: "3", text: "Орта тас ғасыры:", options: ["Палеолит", "Мезолит", "Неолит", "Энеолит"], correctAnswer: "B", explanation: "Мезолит - 'орта тас' ғасыры." },
      { id: "4", text: "Жаңа тас ғасыры:", options: ["Палеолит", "Мезолит", "Неолит", "Энеолит"], correctAnswer: "C", explanation: "Неолит - 'жаңа тас' ғасыры." },
      { id: "5", text: "Палеолиттің мағынасы:", options: ["Орта тас", "Мыс-тас", "Ежелгі тас", "Жаңа тас"], correctAnswer: "C", explanation: "Палеолит - ежелгі тас дәуірі." },
      { id: "6", text: "Мезолиттің шамамен мерзімі:", options: ["б.з.б. 2 млн 600 мың – 12 мың жыл", "б.з.б. 12–5 мың жыл", "б.з.б. 5–3 мың жыл", "б.з.б. 3–2 мың жыл"], correctAnswer: "B" },
      { id: "7", text: "Неолиттің шамамен мерзімі:", options: ["б.з.б. 12–5 мың жыл", "б.з.б. 5–3 мың жыл", "б.з.б. 3–2 мың жыл", "б.з.б. 8–7 мың жыл"], correctAnswer: "B" },
      { id: "8", text: "Қазақстан аумағындағы ең алғашқы адамдардың іздері көбірек табылған өңір:", options: ["Солтүстік Қазақстан", "Шығыс Қазақстан", "Оңтүстік Қазақстан", "Батыс Қазақстан"], correctAnswer: "C" },
      { id: "9", text: "Қаратау жотасынан табылған ежелгі тұрақтар:", options: ["Берел, Шілікті", "Бөріқазған, Тәңірқазған", "Бесшатыр, Есік", "Ботай, Шебір"], correctAnswer: "B" },
      { id: "10", text: "Бөріқазған мен Тәңірқазған қай дәуірге жатады?", options: ["Мезолит", "Неолит", "Ерте палеолит", "Қола дәуірі"], correctAnswer: "C" },
      { id: "11", text: "Алғашқы адамдардың негізгі шикізаты:", options: ["Темір", "Қола", "Тас", "Алтын"], correctAnswer: "C" },
      { id: "12", text: "Алғашқы адамдардың тобыр түріндегі бірлестігі:", options: ["Тайпа", "Рулық қауым", "Адамдар тобыры", "Халық"], correctAnswer: "C" },
      { id: "13", text: "Рулық қауымның қалыптаса бастаған кезеңі:", options: ["Ерте палеолит", "Орта палеолит", "Кейінгі палеолит", "Неолит"], correctAnswer: "C" },
      { id: "14", text: "Саналы адам қалыптасқан кезең:", options: ["Ерте палеолит", "Орта палеолит", "Кейінгі палеолит", "Мезолит"], correctAnswer: "C" },
      { id: "15", text: "Кейінгі палеолитке тән белгі:", options: ["Металл өңдеу", "Рулық қауымның қалыптасуы", "Жазудың пайда болуы", "Қалалардың салынуы"], correctAnswer: "B" },
      { id: "16", text: "Тас дәуіріндегі ең алғашқы еңбек құралдарының бірі:", options: ["Соқа", "Шапқы", "Темір орақ", "Қола қанжар"], correctAnswer: "B" },
      { id: "17", text: "Мезолит дәуірінің басты жаңалығы:", options: ["Металл қорыту", "Қыш құмыра жасау", "Садақ пен жебенің пайда болуы", "Жазудың шығуы"], correctAnswer: "C" },
      { id: "18", text: "Мезолитке тән ұсақ тас құралдар:", options: ["Кескіштер", "Микролиттер", "Балғалар", "Найзалар"], correctAnswer: "B" },
      { id: "19", text: "Климаттың жылынуы, мұздықтардың еруі басталған кезең:", options: ["Ерте палеолит", "Орта палеолит", "Мезолит", "Неолит"], correctAnswer: "C" },
      { id: "20", text: "Итті қолға үйрету басталған кезең:", options: ["Палеолит", "Мезолит", "Неолит", "Қола дәуірі"], correctAnswer: "B" },
      { id: "21", text: "Неолит дәуірінің басты ерекшелігі:", options: ["Тек аңшылықпен шұғылдану", "Садақтың шығуы", "Қыш ыдыс жасаудың кең таралуы", "Темірді пайдалану"], correctAnswer: "C" },
      { id: "22", text: "Неолит дәуірінде кең таралған еңбек тәсілі:", options: ["Тасты жылтырату", "Темірді балқыту", "Қоладан құю", "Болатты шынықтыру"], correctAnswer: "A" },
      { id: "23", text: "Неолит дәуірінде пайда болған маңызды өзгеріс:", options: ["Мемлекеттердің құрылуы", "Өндіруші шаруашылықтың қалыптаса бастауы", "Жазудың шығуы", "Көшпелі империялардың құрылуы"], correctAnswer: "B" },
      { id: "24", text: "Тарихта “неолит төңкерісі” дегеніміз:", options: ["Темір өндірудің басталуы", "Аңшылықтан егіншілік пен мал шаруашылығына көшу", "Қалалардың күйреуі", "Мемлекеттердің бөлінуі"], correctAnswer: "B" },
      { id: "25", text: "Алғашқы адамдардың негізгі кәсібі:", options: ["Егіншілік, сауда", "Мал шаруашылығы, қолөнер", "Аңшылық, терімшілік", "Бау-бақша өсіру"], correctAnswer: "C" },
      { id: "26", text: "Алғашқы қауымдық құрылыста әйелдердің беделі жоғары болған кезең:", options: ["Патриархат", "Матриархат", "Монархия", "Республика"], correctAnswer: "B" },
      { id: "27", text: "Тас дәуіріндегі діни ұғымдардың бірі:", options: ["Буддизм", "Христиандық", "Анимизм", "Ислам"], correctAnswer: "C" },
      { id: "28", text: "Табиғат құбылыстары мен жануарларға табыну сенімі:", options: ["Тотемизм", "Феодализм", "Капитализм", "Урбанизация"], correctAnswer: "A" },
      { id: "29", text: "Алғашқы адамдардың қабірге зат қоса жерлеуі нені көрсетеді?", options: ["Сауданың дамуын", "О дүниеге сенімнің болғанын", "Мемлекеттің құрылғанын", "Жазудың пайда болғанын"], correctAnswer: "B" },
      { id: "30", text: "Жартастарға сурет салу, әшекей бұйымдар жасау көбірек дамыған кезең:", options: ["Ерте палеолит", "Орта палеолит", "Кейінгі палеолит", "Ерте темір дәуірі"], correctAnswer: "C" },
      { id: "31", text: "Мезолит дәуірінде аңшылықтың тиімді болуына әсер еткен жаңалық:", options: ["Соқа", "Садақ пен жебе", "Темір ауыздық", "Арба"], correctAnswer: "B" },
      { id: "32", text: "Жануарлардың соңынан көшіп-қону, шағын топпен өмір сүру қай дәуірге тән?", options: ["Неолит", "Қола дәуірі", "Мезолит", "Темір дәуірі"], correctAnswer: "C" },
      { id: "33", text: "Қазақстандағы кейінгі палеолит тұрақтарының бірі:", options: ["Батпақ", "Ботай", "Бесшатыр", "Шірік-Рабат"], correctAnswer: "A" },
      { id: "34", text: "Батпақ тұрағы қай дәуірге жатады?", options: ["Ерте палеолит", "Кейінгі палеолит", "Неолит", "Темір дәуірі"], correctAnswer: "B" },
      { id: "35", text: "Мезолит дәуіріне жататын тұрақтардың бірі:", options: ["Мичурин", "Тәңірқазған", "Батпақ", "Беғазы"], correctAnswer: "A" },
      { id: "36", text: "Тельман, Мичурин, Әкімбек тұрақтары қай дәуірге тән?", options: ["Палеолит", "Мезолит", "Неолит", "Қола дәуірі"], correctAnswer: "B" },
      { id: "37", text: "Неолит дәуіріне жататын тұрақтардың бірі:", options: ["Қараүңгір", "Шілікті", "Есік", "Берел"], correctAnswer: "A" },
      { id: "38", text: "Сексеуіл тұрағы қай дәуірге жатады?", options: ["Мезолит", "Неолит", "Темір дәуірі", "Қола дәуірі"], correctAnswer: "B" },
      { id: "39", text: "Қазақстанда неолиттік тұрақтардың саны:", options: ["50-ге жуық", "100-ге жуық", "300-ге жуық", "800-ден астам"], correctAnswer: "D" },
      { id: "40", text: "Неолит дәуірінде адамдар қандай жаңалықтарды меңгерді?", options: ["Металл құю, жазу жазу", "Тасты бұрғылау, тегістеу, қыш жасау", "Арба жасау, темір өңдеу", "Ақша соғу, қала салу"], correctAnswer: "B" },
      { id: "41", text: "Қай кезеңде балшықтан ыдыс жасау кең тарады?", options: ["Палеолит", "Мезолит", "Неолит", "Қола дәуірі"], correctAnswer: "C" },
      { id: "42", text: "Мезолит дәуірінде адамдардың өміріне көбірек әсер еткен табиғи өзгеріс:", options: ["Мұздықтардың ұлғаюы", "Климаттың күрт суытуы", "Мұз дәуірінің аяқталып, жылынудың басталуы", "Шөлейттің толық жойылуы"], correctAnswer: "C" },
      { id: "43", text: "Тас дәуіріндегі еңбек бөлінісінің қарапайым түрі:", options: ["Саудагерлер мен шенеуніктерге бөліну", "Ерлер аң аулап, әйелдер терімшілікпен айналысуы", "Қала мен ауылға бөліну", "Әскер мен діни топқа бөліну"], correctAnswer: "B" },
      { id: "44", text: "Алғашқы адамдардың баспанасы ретінде жиі пайдаланылған орын:", options: ["Сарайлар", "Үңгірлер", "Кесенелер", "Қалалар"], correctAnswer: "B" },
      { id: "45", text: "Тас дәуірінде адамдардың негізгі кәсібіне жатпайды:", options: ["Аңшылық", "Терімшілік", "Балық аулау", "Машина жасау"], correctAnswer: "D" },
      { id: "46", text: "Кейінгі палеолитте адамдардың қоғамдық өмірінде болған өзгеріс:", options: ["Мемлекет пайда болды", "Рулық қауым қалыптасты", "Заң жүйесі шықты", "Ақша айналымы туды"], correctAnswer: "B" },
      { id: "47", text: "Неолит дәуіріндегі адамдардың отырықшылыққа жақындай түсуінің басты себебі:", options: ["Темірді игеруі", "Өндіруші шаруашылықтың дами бастауы", "Мемлекеттің құрылуы", "Жазудың таралуы"], correctAnswer: "B" },
      { id: "48", text: "Тас дәуіріндегі адамдардың негізгі кәсібін кейінірек өзгеріске түсірген кезең:", options: ["Неолит", "Ерте палеолит", "Орта палеолит", "Мезолит"], correctAnswer: "A" },
      { id: "49", text: "Қай қатар толықтай тас дәуірінің кезеңдерінен тұрады?", options: ["Палеолит, мезолит, неолит", "Энеолит, қола, темір", "Неолит, қола, орта ғасыр", "Палеолит, темір, антикалық дәуір"], correctAnswer: "A" },
      { id: "50", text: "Тас дәуірін оқуда ҰБТ-да ең жиі сұралатын негізгі тірек ұғым:", options: ["Индустрияландыру", "Рулық қауым", "Парламент", "Урбандалу"], correctAnswer: "B" }
    ]
  }
};

const UBT_TOPICS: Record<string, { topics: string[], description: string }> = {
  "Қазақстан тарихы": {
    description: "Ежелгі дәуірден бүгінгі күнге дейінгі Қазақстан тарихының толық курсы.",
    topics: [
      "Тас дәуірі", "Қола дәуірі", "Ерте темір дәуірі", "Сақ, ғұн, үйсін, қаңлы", "Түрік қағанаттары", "Орта ғасыр мемлекеттері",
      "Қарахан, Қыпшақ, Найман, Керейіт, Жалайыр", "Алтын Орда, Ақ Орда, Моғолстан, Ноғай Ордасы, Әбілқайыр хандығы",
      "Қазақ хандығының құрылуы мен дамуы", "Жоңғар шапқыншылығы", "Ресей империясы тұсындағы Қазақстан",
      "Ұлт-азаттық көтерілістер", "ХХ ғасыр басы, Алаш қозғалысы", "Кеңестік кезең, ашаршылық, қуғын-сүргін, ҰОС",
      "Тәуелсіз Қазақстан, Конституциялар, саяси реформалар, экономика, мәдениет, халықаралық қатынастар"
    ]
  },
  "Оқу сауаттылығы": {
    description: "Мәтінді талдау, интерпретациялау және логикалық қорытынды жасау дағдылары.",
    topics: [
      "Мәтіннің тақырыбы мен негізгі ойы", "Мәтіндегі ашық және жасырын ақпарат", "Стиль түрлері", "Мәтін құрылымы",
      "Логикалық байланыс", "Автор көзқарасы", "Факті мен пікірді ажырату", "Қорытынды шығару", "Салыстыру",
      "Мәтін бойынша интерпретация", "Бірнеше мәтінді салыстырып талдау", "Кесте, сызба, диаграммадағы ақпаратты оқу"
    ]
  },
  "Математикалық сауаттылық": {
    description: "Күнделікті өмірдегі сандық мәліметтерді талдау және логикалық есептер.",
    topics: [
      "Сан және есептеу", "Бөлшек, пайыз, пропорция", "Орташа мән", "Қозғалыс, жұмыс, қоспа есептері",
      "Кесте, график, диаграмма талдау", "Ықтималдықтың қарапайым элементтері", "Практикалық геометрия",
      "Уақыт, қашықтық, масса, көлем бірліктері", "Қаржылық сауаттылық элементтері", "Күнделікті өмірдегі логикалық-сандық есептер"
    ]
  },
  "Математика": {
    description: "Алгебра, тригонометрия және геометрияның тереңдетілген курсы.",
    topics: [
      "Сандар мен өрнектер", "Теңдеулер мен теңсіздіктер", "Функциялар және графиктер", "Дәреже, түбір, логарифм",
      "Тригонометрия", "Арифметикалық және геометриялық прогрессия", "Туынды және оның қолданылуы",
      "Алғашқы функция және интегралдың бастапқы түсініктері", "Векторлар", "Координаталар әдісі",
      "Планиметрия", "Стереометрия", "Комбинаторика және ықтималдық"
    ]
  },
  "Физика": {
    description: "Классикалық механикадан бастап атомдық физикаға дейінгі негізгі заңдар.",
    topics: [
      "Кинематика", "Динамика", "Сақталу заңдары", "Статика және гидростатика", "Молекулалық физика",
      "Термодинамика", "Электростатика", "Тұрақты ток заңдары", "Магнит өрісі", "Электромагниттік индукция",
      "Тербелістер мен толқындар", "Оптика", "Атом және ядро физикасы", "Радиация", "Астрономияның негізгі элементтері"
    ]
  },
  "Химия": {
    description: "Заттардың құрылысы, қасиеттері және химиялық реакциялар.",
    topics: [
      "Атом құрылысы", "Периодтық заң", "Химиялық байланыс", "Зат құрылысы", "Химиялық реакциялар және олардың заңдылықтары",
      "Тотығу-тотықсыздану", "Ерітінділер", "Электролиттік диссоциация", "Бейорганикалық қосылыстардың негізгі кластары",
      "Металдар мен бейметалдар", "Органикалық химияның бастамалары", "Көмірсутектер", "Спирттер, альдегидтер, карбон қышқылдары, эфирлер",
      "Аминдер, аминқышқылдар, ақуыздар", "Есептер мен сапалық реакциялар"
    ]
  },
  "Биология": {
    description: "Тірі ағзалардың құрылысы, генетика және адам анатомиясы.",
    topics: [
      "Жасуша теориясы", "Органоидтар", "Зат алмасу", "Фотосинтез және тыныс алу", "Генетика және тұқымқуалаушылық",
      "Селекция", "Эволюция", "Экология", "Адам анатомиясы мен физиологиясы", "Жүйке, қанайналым, тыныс алу, ас қорыту, зәр шығару, эндокриндік жүйелер",
      "Ботаника", "Зоология", "Микроорганизмдер", "Биотехнология элементтері"
    ]
  },
  "География": {
    description: "Дүниежүзілік және Қазақстанның географиялық ерекшеліктері.",
    topics: [
      "Географиялық зерттеу әдістері", "Карта, масштаб, координаталар", "Литосфера, атмосфера, гидросфера, биосфера",
      "Климат және климат түзуші факторлар", "Табиғат зоналары", "Демография", "Урбандалу", "Дүниежүзінің саяси картасы",
      "Елтану", "Табиғи ресурстар географиясы", "Өнеркәсіп, ауыл шаруашылығы, көлік, қызмет көрсету саласы",
      "Қазақстанның экономикалық және әлеуметтік географиясы", "Экологиялық проблемалар", "Ғаламдық мәселелер"
    ]
  },
  "Дүниежүзі тарихы": {
    description: "Ежелгі заманнан бүгінгі күнге дейінгі жаһандық тарих.",
    topics: [
      "Ежелгі өркениеттер", "Антикалық дүние", "Орта ғасырлар", "Феодалдық қоғам", "Ислам өркениеті", "Қайта өрлеу",
      "Реформация", "Ұлы географиялық ашулар", "Буржуазиялық революциялар", "Индустрияландыру", "Отаршылдық",
      "І және ІІ дүниежүзілік соғыс", "Версаль-Вашингтон жүйесі", "Қырғи-қабақ соғыс", "Деколонизация",
      "Халықаралық қатынастар", "ХХ-ХХІ ғасырдағы жаһандық үрдістер"
    ]
  },
  "Құқық негіздері": {
    description: "Мемлекет және құқық теориясы, ҚР заңнамасы.",
    topics: [
      "Мемлекет және құқық теориясы", "Конституция", "Адам және азамат құқықтары", "Сайлау жүйесі", "Мемлекеттік басқару",
      "Әкімшілік құқық", "Азаматтық құқық", "Еңбек құқығы", "Отбасы құқығы", "Қылмыстық құқық", "Сыбайлас жемқорлыққа қарсы мәдениет",
      "Сот жүйесі", "Құқықтық жауапкершілік", "Халықаралық құқықтың негізгі ұғымдары"
    ]
  },
  "Информатика": {
    description: "Ақпараттық технологиялар мен программалау негіздері.",
    topics: [
      "Ақпарат және ақпараттық процестер", "Компьютер архитектурасы", "Операциялық жүйелер", "Файлдар және деректер",
      "Ақпаратты кодтау", "Логика элементтері", "Алгоритмдеу", "Программалау негіздері", "Деректер қоры",
      "Электрондық кестелер", "Желілер және интернет", "Киберқауіпсіздік", "Веб-технология негіздері", "Модельдеу", "Цифрлық сауаттылық"
    ]
  },
  "Ағылшын тілі": {
    description: "Reading, Grammar, and Vocabulary development.",
    topics: [
      "Reading comprehension", "Vocabulary in context", "Grammar: tenses", "Passive voice", "Reported speech",
      "Conditionals", "Modal verbs", "Articles", "Prepositions", "Relative clauses", "Word formation",
      "Sentence transformation", "Cloze test", "Matching", "Everyday and academic topics"
    ]
  },
  "Қазақ тілі": {
    description: "Тілдік нормалар мен грамматикалық сауаттылық.",
    topics: [
      "Фонетика", "Орфоэпия", "Орфография", "Лексика және фразеология", "Сөзжасам", "Морфология", "Сөз таптары",
      "Сөйлем мүшелері", "Жай сөйлем", "Құрмалас сөйлем", "Синтаксис", "Тыныс белгілері", "Мәтін түрлері",
      "Стильдер", "Тілдік норма", "Грамматикалық талдау"
    ]
  },
  "Қазақ әдебиеті": {
    description: "Әдеби бағыттар, жанрлар және шығармаларды талдау.",
    topics: [
      "Әдеби бағыттар мен жанрлар", "Әдеби-теориялық ұғымдар", "Ақын-жазушылардың өмірі мен шығармашылығы",
      "Поэзия талдауы", "Прозалық шығармаларды талдау", "Драмалық шығармалар", "Кейіпкер бейнесі",
      "Идея, тақырып, композиция", "Тарихи-көркемдік маңызы", "Автор позициясы", "Әдеби шығарма бойынша салыстырмалы талдау"
    ]
  },
  "Орыс тілі": {
    description: "Лексико-грамматические нормы русского языка.",
    topics: [
      "Фонетика, лексика", "Грамматика, морфология", "Синтаксис, пунктуация", "Мәтінді түсіну", "Стильдер",
      "Тілдік норма", "Сөз қолданысы"
    ]
  },
  "Орыс әдебиеті": {
    description: "Русская классическая и современная литература.",
    topics: [
      "Авторлар мен шығармалар", "Жанрлар", "Әдеби талдау", "Кейіпкер", "Идея, композиция", "Тарихи-әдеби контекст"
    ]
  }
};

const getSubjectIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("тарих")) return GraduationCap;
  if (n.includes("мат") && !n.includes("сауаттылық")) return Calculator;
  if (n.includes("сауаттылық") && n.includes("оқу")) return Languages;
  if (n.includes("математикалық сауаттылық")) return ListChecks;
  if (n.includes("физика")) return Atom;
  if (n.includes("химия")) return FlaskConical;
  if (n.includes("география")) return Globe;
  if (n.includes("биология")) return Dna;
  if (n.includes("құқық")) return Scale;
  if (n.includes("информатика")) return Terminal;
  if (n.includes("тіл")) return BookText;
  if (n.includes("әдебиет")) return FileText;
  return BookOpen;
};

export default function TheoryPage() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  if (!profile) return null;

  const userSubjects = profile.selectedSubjects || [];
  
  // Normalize subject names for comparison
  const normalizedUserSubjects = userSubjects.map(s => s === "Математикалық сауаттылық" ? "Математикалық сауаттылық" : s);

  const mySubjects = Object.keys(UBT_TOPICS).filter(s => {
    const isSelected = normalizedUserSubjects.includes(s);
    return isSelected && s.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tight font-headline flex items-center gap-3">
                <BookOpen className="size-10 text-primary" />
                Практикалық база
              </h1>
              <p className="text-muted-foreground font-medium">Сіздің таңдаған ҰБТ пәндеріңіз бойынша дайындық.</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <Trophy className="size-5 text-yellow-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Сенің ұпайың</span>
                <span className="text-sm font-black text-primary leading-tight">{profile.rating} ұпай</span>
              </div>
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input 
              placeholder="Пәнді немесе тақырыпты іздеу..." 
              className="pl-12 h-14 bg-white border-none shadow-md rounded-2xl text-base focus-visible:ring-primary" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-primary" />
            <h2 className="text-2xl font-black font-headline tracking-tight">Менің пәндерім</h2>
          </div>
          {mySubjects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mySubjects.map((subject, i) => (
                <SubjectCard key={i} subject={subject} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed">
              <p className="text-muted-foreground">Пәндер табылмады. Тіркелу кезіндегі таңдауды тексеріңіз.</p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SubjectCard({ subject }: { subject: string }) {
  const Icon = getSubjectIcon(subject);
  const ubtInfo = UBT_TOPICS[subject];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all group bg-white border-none shadow-sm rounded-3xl overflow-hidden flex flex-col h-full">
          <div className="h-2 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent group-hover:from-primary/40 transition-all" />
          <CardHeader className="p-6">
            <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
              <Icon className="size-7" />
            </div>
            <CardTitle className="text-xl font-black">{subject}</CardTitle>
            <CardDescription className="text-xs font-medium leading-relaxed mt-2 text-muted-foreground line-clamp-2">
              {ubtInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto p-6 pt-0">
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Тақырыптар</span>
                <span className="text-sm font-black text-primary">{ubtInfo.topics.length} бөлім</span>
              </div>
              <div className="size-10 rounded-full bg-accent/50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-white border-none shadow-2xl p-0 rounded-3xl overflow-hidden">
        <div className="bg-primary/5 p-8 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="size-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Icon className="size-7" />
              </div>
              <div>
                <Badge variant="outline" className="mb-1 bg-white/50 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest">Тақырыптық практика</Badge>
                <DialogTitle className="text-3xl font-black font-headline">{subject}</DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-sm font-medium text-muted-foreground max-w-xl">
              Нақты тақырыпты таңдап, практика жасаңыз. Әрбір дұрыс жауап үшін +2 рейтинг ұпайы қосылады.
            </DialogDescription>
          </DialogHeader>
        </div>
        <ScrollArea className="max-h-[60vh] p-8">
          <div className="grid gap-4">
            {ubtInfo.topics.map((topic, idx) => (
              <TopicItem key={idx} index={idx} topic={topic} subject={subject} />
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 bg-muted/20 border-t flex items-center justify-center gap-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="size-4 text-primary animate-pulse" />
            {subject === "Қазақстан тарихы" && ubtInfo.topics.includes("Тас дәуірі") ? "Арнайы 50 тест сұрағы енгізілді" : "AI Куратор сізге арнап жаңа сұрақтар дайындайды"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TopicItem({ index, topic, subject }: { index: number, topic: string, subject: string }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { user } = useAuth();

  const [practiceMode, setPracticeMode] = useState<"reading" | "loading" | "testing" | "results">("reading");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState({ score: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startPractice = async () => {
    setPracticeMode("loading");
    setErrorMessage(null);
    try {
      // Check for static tests
      if (STATIC_TESTS[subject] && STATIC_TESTS[subject][topic]) {
        const staticQuestions = STATIC_TESTS[subject][topic];
        setQuestions(staticQuestions);
        setCurrentIndex(0);
        setAnswers({});
        setPracticeMode("testing");
        return;
      }

      const { questions: newQuestions } = await generateUntQuestions({ 
        subject, 
        topic, 
        count: 5 
      });
      setQuestions(newQuestions || []);
      setCurrentIndex(0);
      setAnswers({});
      setPracticeMode("testing");
    } catch (error: any) {
      let msg = "Сұрақтарды жүктеу мүмкін болмады.";
      if (error.message?.includes("AI_QUOTA_EXCEEDED")) {
        msg = "AI лимиті аяқталды. 1-2 минуттан соң қайталаңыз.";
      }
      setErrorMessage(msg);
      setPracticeMode("reading");
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishPractice();
    }
  };

  const finishPractice = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    
    setTestResult({ score: correct, total: questions.length });
    setPracticeMode("results");

    if (user && correct > 0) {
      updateUserRating(user.uid, 'CORRECT_ANSWER');
    }
  };

  const isStatic = STATIC_TESTS[subject] && STATIC_TESTS[subject][topic];

  return (
    <Dialog open={isDetailOpen} onOpenChange={(open) => {
      setIsDetailOpen(open);
      if(!open) {
        setPracticeMode("reading");
        setQuestions([]);
      }
    }}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between p-5 rounded-2xl border bg-white hover:bg-primary/5 hover:border-primary/30 transition-all group/item cursor-pointer shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-inner">
              {index + 1}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold group-hover/item:text-primary transition-colors">{topic}</span>
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 uppercase tracking-wider">
                <Clock className="size-2.5" /> {isStatic ? `${STATIC_TESTS[subject][topic].length} сұрақ` : "15-20 мин практика"}
              </span>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="rounded-full size-10 p-0 text-primary group-hover/item:bg-primary group-hover/item:text-white">
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl bg-white">
        <div className="p-8 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">{subject}</Badge>
              {isStatic && <Badge className="bg-green-500 text-white text-[9px] uppercase tracking-tighter">Бекітілген база</Badge>}
            </div>
            <DialogTitle className="text-3xl font-black font-headline tracking-tight">{topic}</DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 p-8">
          {practiceMode === "reading" && (
            <div className="py-16 flex flex-col items-center text-center gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="size-24 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground shadow-inner">
                <BookOpen className="size-12 opacity-50" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold">Тақырыптық бекіту</h4>
                <p className="text-sm text-muted-foreground max-w-sm font-medium">
                  {isStatic 
                    ? `Бұл тақырып бойынша арнайы дайындалған ${STATIC_TESTS[subject][topic].length} тест сұрағын тапсырып, біліміңізді шыңдаңыз.`
                    : "Бұл бөлім бойынша біліміңізді AI арқылы тексеріп, рейтинг ұпайына ие болыңыз."}
                </p>
              </div>

              <div className="pt-8 border-t border-dashed w-full">
                <Button 
                  className="w-full gap-3 h-16 text-xl font-black shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-secondary rounded-2xl hover:scale-[1.02] transition-all"
                  onClick={startPractice}
                >
                  <Sparkles className="size-6" />
                  Практиканы бастау {isStatic && `(${STATIC_TESTS[subject][topic].length} тест)`}
                </Button>
                <div className="flex flex-col items-center gap-1 mt-4">
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    {isStatic ? "Дайын тест базасы" : "AI Сұрақтарды құрастыруда"}
                  </p>
                  <p className="text-[10px] text-primary font-bold">+2 рейтинг ұпайы (әр дұрыс жауапқа)</p>
                </div>
                {errorMessage && (
                  <div className="mt-6 p-4 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-3 border border-destructive/20">
                    <AlertCircle className="size-5" /> {errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}

          {practiceMode === "loading" && (
            <div className="py-32 flex flex-col items-center justify-center gap-6 text-center">
              <div className="relative">
                <div className="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="size-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-black text-2xl tracking-tight">{isStatic ? "Тест жүктелуде..." : "AI сұрақтарды құрастыруда..."}</p>
                <p className="text-sm text-muted-foreground font-medium">Тақырыптың ең маңызды тұстары таңдалуда.</p>
              </div>
            </div>
          )}

          {practiceMode === "testing" && questions.length > 0 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Прогресс</span>
                    <span className="text-2xl font-black font-headline">Сұрақ {currentIndex + 1} / {questions.length}</span>
                  </div>
                  <Badge variant="secondary" className="h-7 px-4 rounded-full bg-primary/10 text-primary border-none text-[10px] font-bold">Тест режимі</Badge>
                </div>
                <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-2 rounded-full" />
              </div>

              <Card className="border-none shadow-xl bg-white p-8 rounded-3xl ring-1 ring-border">
                <h3 className="text-xl md:text-2xl font-black leading-tight mb-10 text-foreground">
                  {questions[currentIndex].text}
                </h3>
                <div className="grid gap-4">
                  {questions[currentIndex].options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = answers[currentIndex] === letter;
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleAnswer(letter)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-5 group active:scale-[0.98] ${
                          isSelected ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border bg-white hover:border-primary/30"
                        }`}
                      >
                        <span className={`size-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-all ${
                          isSelected ? "bg-primary text-primary-foreground border-primary shadow-lg" : "group-hover:border-primary/50 text-muted-foreground"
                        }`}>
                          {letter}
                        </span>
                        <span className={`font-bold text-base ${isSelected ? "text-primary" : "text-foreground"}`}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Button 
                className="w-full h-16 gap-3 font-black text-lg rounded-2xl shadow-xl shadow-primary/20" 
                disabled={!answers[currentIndex]}
                onClick={nextQuestion}
              >
                {currentIndex === questions.length - 1 ? "Нәтижені көру" : "Келесі сұрақ"}
                <ArrowRight className="size-5" />
              </Button>
            </div>
          )}

          {practiceMode === "results" && (
            <div className="py-12 space-y-10 animate-in zoom-in-95 duration-500">
              <div className="text-center space-y-6">
                <div className="inline-flex size-32 rounded-full bg-yellow-100 text-yellow-600 items-center justify-center shadow-inner relative">
                  <Trophy className="size-16 drop-shadow-sm" />
                  <Sparkles className="absolute -top-2 -right-2 size-8 text-yellow-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-4xl font-black font-headline tracking-tighter">Нәтиже: {testResult.score} / {testResult.total}</h3>
                  <p className="text-muted-foreground text-lg font-medium mt-2">
                    {testResult.score === testResult.total ? "Керемет! Бұл тақырыпты 100% меңгердіңіз! 🚀" : "Жақсы нәтиже! Қателермен жұмыс істеуді ұмытпаңыз."}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Жауаптарды талдау</h4>
                <div className="grid gap-4">
                  {questions.map((q, i) => (
                    <div key={i} className={`p-6 rounded-3xl border ${answers[i] === q.correctAnswer ? 'bg-green-50/50 border-green-100' : 'bg-destructive/5 border-destructive/10'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${answers[i] === q.correctAnswer ? 'bg-green-500 text-white' : 'bg-destructive text-white'}`}>
                          {answers[i] === q.correctAnswer ? <CheckCircle2 className="size-6" /> : <XCircle className="size-6" />}
                        </div>
                        <div className="space-y-3">
                          <p className="text-base font-bold leading-tight">{q.text}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest">
                            <span className={answers[i] === q.correctAnswer ? 'text-green-700' : 'text-destructive'}>Сенің жауабың: {answers[i]}</span>
                            <span className="text-green-700">Дұрыс жауап: {q.correctAnswer}</span>
                          </div>
                          {(q.explanation || answers[i] !== q.correctAnswer) && (
                            <div className="p-4 rounded-2xl bg-white/50 border border-border/50">
                              <p className="text-xs text-muted-foreground italic leading-relaxed font-medium">
                                <span className="font-black text-primary mr-1">Түсіндірме:</span> {q.explanation || "Бұл сұрақтың жауабын есте сақтаңыз."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full h-16 font-black text-lg rounded-2xl border-2" onClick={() => setPracticeMode("reading")}>
                Бөлімге қайту
              </Button>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-6 border-t bg-muted/10 flex justify-center">
          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
            <Sparkles className="size-3 text-primary" /> BilimAI — Сапалы дайындық кепілі
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
