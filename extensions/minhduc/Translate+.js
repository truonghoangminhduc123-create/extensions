(function(Scratch) {
  'use strict';

  class TranslatePlus {
    getInfo() {
      return {
        id: 'translatePlus',
        name: 'Translate+',
        color1: '#4C97FF',
        color2: '#3373CC',
        blocks: [
          {
            opcode: 'getTranslation',
            blockType: Scratch.BlockType.REPORTER,
            text: 'translate [TEXT] using [SERVICE] to [LANG]',
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Hello'
              },
              SERVICE: {
                type: Scratch.ArgumentType.STRING,
                menu: 'services',
                defaultValue: 'Google'
              },
              LANG: {
                type: Scratch.ArgumentType.STRING,
                menu: 'languages',
                defaultValue: 'Vietnamese'
              }
            }
          }
        ],
        menus: {
          services: {
            acceptReporters: true,
            items: ['Google', 'Bing', 'Reverso', 'Alibaba']
          },
          languages: {
            acceptReporters: true,
            items: [
              'Vietnamese', 'English', 'Chinese (Simplified)', 'Chinese (Traditional)',
              'Japanese', 'Korean', 'French', 'German', 'Russian',
              'Spanish', 'Portuguese', 'Italian', 'Thai', 'Lao',
              'Khmer', 'Indonesian', 'Malay', 'Arabic', 'Hindi',
              'Turkish', 'Dutch', 'Polish', 'Swedish', 'Danish',
              'Finnish', 'Norwegian', 'Greek', 'Hebrew', 'Bengali',
              'Persian', 'Urdu', 'Filipino', 'Romanian', 'Hungarian',
              'Czech', 'Ukrainian', 'Burmese', 'Swahili', 'Amharic',
              'Telugu', 'Tamil', 'Marathi', 'Gujarati', 'Kannada',
              'Malayalam', 'Punjabi', 'Slovak', 'Bulgarian', 'Croatian',
              'Serbian', 'Lithuanian', 'Latvian', 'Estonian', 'Slovenian', 'Icelandic'
            ]
          }
        }
      };
    }

    async getTranslation(args) {
      const textInput = args.TEXT;
      const serviceInput = args.SERVICE;
      const langInput = args.LANG;
      
      // Cập nhật endpoint chính xác theo tài liệu curl mới: có thêm /gradio_api
      const baseUrl = 'https://tuhbooh-translator.hf.space/gradio_api/call/translate';
      
      const langMap = {
        'Vietnamese': 'Tiếng Việt', 'English': 'Tiếng Anh', 'Chinese (Simplified)': 'Tiếng Trung (Giản)',
        'Chinese (Traditional)': 'Tiếng Trung (Phồn)', 'Japanese': 'Tiếng Nhật', 'Korean': 'Tiếng Hàn',
        'French': 'Tiếng Pháp', 'German': 'Tiếng Đức', 'Russian': 'Tiếng Nga', 'Spanish': 'Tiếng Tây Ban Nha',
        'Portuguese': 'Tiếng Bồ Đào Nha', 'Italian': 'Tiếng Ý', 'Thai': 'Tiếng Thái', 'Lao': 'Tiếng Lào',
        'Khmer': 'Tiếng Khơ-me', 'Indonesian': 'Tiếng Indonesia', 'Malay': 'Tiếng Mã Lai', 'Arabic': 'Tiếng Ả Rập',
        'Hindi': 'Tiếng Ấn Độ (Hindi)', 'Turkish': 'Tiếng Thổ Nhĩ Kỳ', 'Dutch': 'Tiếng Hà Lan', 'Polish': 'Tiếng Ba Lan',
        'Swedish': 'Tiếng Thụy Điển', 'Danish': 'Tiếng Đan Mạch', 'Finnish': 'Tiếng Phần Lan', 'Norwegian': 'Tiếng Na Uy',
        'Greek': 'Tiếng Hy Lạp', 'Hebrew': 'Tiếng Do Thái', 'Bengali': 'Tiếng Bengali', 'Persian': 'Tiếng Ba Tư',
        'Urdu': 'Tiếng Urdu', 'Filipino': 'Tiếng Philippines', 'Romanian': 'Tiếng Rumani', 'Hungarian': 'Tiếng Hungari',
        'Czech': 'Tiếng Séc', 'Ukrainian': 'Tiếng Ukraina', 'Burmese': 'Tiếng Miến Điện', 'Swahili': 'Tiếng Swahili',
        'Amharic': 'Tiếng Amharic', 'Telugu': 'Tiếng Telugu', 'Tamil': 'Tiếng Tamil', 'Marathi': 'Tiếng Marathi',
        'Gujarati': 'Tiếng Gujarati', 'Kannada': 'Tiếng Kannada', 'Malayalam': 'Tiếng Malayalam', 'Punjabi': 'Tiếng Punjab',
        'Slovak': 'Tiếng Slovak', 'Bulgarian': 'Tiếng Bulgaria', 'Croatian': 'Tiếng Croatia', 'Serbian': 'Tiếng Serbia',
        'Lithuanian': 'Tiếng Litva', 'Latvian': 'Tiếng Latvia', 'Estonian': 'Tiếng Estonia', 'Slovenian': 'Tiếng Slovenia',
        'Icelandic': 'Tiếng Iceland'
      };

      const backendLangName = langMap[langInput] || langInput;

      try {
        // BƯỚC 1: Gọi POST để lấy EVENT_ID (Khớp lệnh curl bước 1)
        const callResponse = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [textInput, serviceInput, backendLangName]
          })
        });

        if (!callResponse.ok) return "Error " + callResponse.status;
        
        const { event_id } = await callResponse.json();

        // BƯỚC 2: Gọi GET để nhận kết quả (Khớp lệnh curl bước 2)
        const resultResponse = await fetch(`${baseUrl}/${event_id}`);
        
        if (!resultResponse.ok) return "Result Error";

        const rawResult = await resultResponse.text();
        
        // Phân tích dữ liệu từ stream trả về của Gradio
        // Nó sẽ trả về chuỗi có chứa "event: complete" và "data: [...]"
        const dataLines = rawResult.split('\n');
        for (const line of dataLines) {
          if (line.startsWith('data:')) {
            const dataContent = line.replace('data:', '').trim();
            try {
              const dataArray = JSON.parse(dataContent);
              if (Array.isArray(dataArray) && dataArray.length > 0) {
                return dataArray[0];
              }
            } catch (e) {
              continue; // Bỏ qua nếu dòng này không phải JSON hợp lệ
            }
          }
        }

        return "Translation failed";
      } catch (e) {
        console.error("Translate+ Error:", e);
        return "Connect Failed";
      }
    }
  }

  Scratch.extensions.register(new TranslatePlus());
})(Scratch);
