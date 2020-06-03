class SimpleImage {
    constructor({data, api, config}) {
        this.data = {
            url: data.url || '',
            caption: data.caption || '',
            withBorder: data.withBorder !== undefined ? data.withBorder : false,
            withBackground: data.withBackground !== undefined ? data.withBackground : false,
            stretched: data.stretched !== undefined ? data.stretched : false,
        };
        this.api = api;
        this.config = config || {};
        this.wrapper = undefined;
        this.settings = [{
                name: 'withBorder',
                icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.8 10.592v2.043h2.35v2.138H15.8v2.232h-2.25v-2.232h-2.4v-2.138h2.4v-2.28h2.25v.237h1.15-1.15zM1.9 8.455v-3.42c0-1.154.985-2.09 2.2-2.09h4.2v2.137H4.15v3.373H1.9zm0 2.137h2.25v3.325H8.3v2.138H4.1c-1.215 0-2.2-.936-2.2-2.09v-3.373zm15.05-2.137H14.7V5.082h-4.15V2.945h4.2c1.215 0 2.2.936 2.2 2.09v3.42z"/></svg>`
            },{
                name: 'stretched',
                icon: `<svg width="17" height="10" viewBox="0 0 17 10" xmlns="http://www.w3.org/2000/svg"><path d="M13.568 5.925H4.056l1.703 1.703a1.125 1.125 0 0 1-1.59 1.591L.962 6.014A1.069 1.069 0 0 1 .588 4.26L4.38.469a1.069 1.069 0 0 1 1.512 1.511L4.084 3.787h9.606l-1.85-1.85a1.069 1.069 0 1 1 1.512-1.51l3.792 3.791a1.069 1.069 0 0 1-.475 1.788L13.514 9.16a1.125 1.125 0 0 1-1.59-1.591l1.644-1.644z"/></svg>`
            },{
                name: 'withBackground',
                icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.043 8.265l3.183-3.183h-2.924L4.75 10.636v2.923l4.15-4.15v2.351l-2.158 2.159H8.9v2.137H4.7c-1.215 0-2.2-.936-2.2-2.09v-8.93c0-1.154.985-2.09 2.2-2.09h10.663l.033-.033.034.034c1.178.04 2.12.96 2.12 2.089v3.23H15.3V5.359l-2.906 2.906h-2.35zM7.951 5.082H4.75v3.201l3.201-3.2zm5.099 7.078v3.04h4.15v-3.04h-4.15zm-1.1-2.137h6.35c.635 0 1.15.489 1.15 1.092v5.13c0 .603-.515 1.092-1.15 1.092h-6.35c-.635 0-1.15-.489-1.15-1.092v-5.13c0-.603.515-1.092 1.15-1.092z"/></svg>`
            }]
    }
    
    static get toolbox() {
        return {
            title: 'Image',
            icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
        };
    }

    static get pasteConfig() {
        return {
          tags: ['IMG'],
          files: {
            mimeTypes: ['image/*'],
            extensions: ['gif', 'jpg', 'png', 'jpeg'] // You can specify extensions instead of mime-types
          },
          files: {
            mimeTypes: ['image/*'],
            extensions: ['gif', 'jpg', 'png', 'jpeg'] // You can specify extensions instead of mime-types
          },
          patterns: {
            image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png)$/i
          }
        }
    }

    static get sanitize(){
        return {
          url: false, // disallow HTML
          caption: {} // only tags from Inline Toolbar 
        }
    }

    onPaste(event){
        switch (event.type){
            // ... case 'tag'
            case 'file':
                /* We need to read file here as base64 string */
                const file = event.detail.file;
                const reader = new FileReader();
        
                reader.onload = (loadEvent) => {
                this._createImage(loadEvent.target.result);
                };
        
                reader.readAsDataURL(file);
                break;
            case 'tag':
                const imgTag = event.detail.data;
        
                this._createImage(imgTag.src);
                break;
            case 'pattern':
                const src = event.detail.data;
            
                this._createImage(src);
                break;
        }
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('simple-image');

        if (this.data && this.data.url){
            this._createImage(this.data.url, this.data.caption);
            return this.wrapper;
        }

        const input = document.createElement('input');

        input.placeholder = input.placeholder = this.config.placeholder || 'Paste an image URL...';
            input.addEventListener('paste', (event) => {
            this._createImage(event.clipboardData.getData('text'));
        });

        this.wrapper.appendChild(input);

        return this.wrapper;
    }

    save(blockContent){
        const image = blockContent.querySelector('img');
        const caption = blockContent.querySelector('[contenteditable]');

        return Object.assign(this.data, {
            url: image.src,
            caption: caption.innerHTML || ''
        });
    }

    validate(savedData){
        if (!savedData.url.trim()){
            return false;
        }

        return true;
    }

    _createImage(url, captionText){
        const image = document.createElement('img');
        const caption = document.createElement('input');

        image.src = url;
        caption.placeholder = 'Caption...';
        caption.contentEditable = true;
        caption.value = captionText || '';

        this.wrapper.innerHTML = '';
        this.wrapper.appendChild(image);
        this.wrapper.appendChild(caption);

        this._acceptTuneView();
    }

    renderSettings(){
        const wrapper = document.createElement('div');
    
        this.settings.forEach( tune => {
            let button = document.createElement('div');
    
            button.classList.add(this.api.styles.settingsButton);
            button.classList.toggle(this.api.styles.settingsButtonActive, this.data[tune.name]);
            button.innerHTML = tune.icon;
            wrapper.appendChild(button);
    
            button.addEventListener('click', () => {
                this._toggleTune(tune.name);
                button.classList.toggle(this.api.styles.settingsButtonActive);
            });
        });
    
        return wrapper;
    }

    _toggleTune(tune) {
        this.data[tune] = !this.data[tune];
        this._acceptTuneView();
    }

    _acceptTuneView() {
        this.settings.forEach( tune => {
          this.wrapper.classList.toggle(tune.name, !!this.data[tune.name]);
      
          if (tune.name === 'stretched') {
            this.api.blocks.stretchBlock(this.api.blocks.getCurrentBlockIndex(), !!this.data.stretched);
          }
        });
    }
}

class MarkerTool {
    static get isInline() {
      return true;
    }

    static get sanitize() {
        return {
            mark: {
                class: 'cdx-marker'
            }
        };
    }
  
    get shortcut() {
        return 'CMD+M';
    }

    clear() {
        this.hideActions();
    }

    get state() {
      return this._state;
    }
  
    set state(state) {
      this._state = state;
  
      this.button.classList.toggle(this.api.styles.inlineToolButtonActive, state);
    }
  
    constructor({api}) {
      this.api = api;
      this.button = null;
      this._state = false;
  
      this.tag = 'MARK';
      this.class = 'cdx-marker';
    }
  
    render() {
      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.innerHTML = '<svg width="20" height="18"><path d="M10.458 12.04l2.919 1.686-.781 1.417-.984-.03-.974 1.687H8.674l1.49-2.583-.508-.775.802-1.401zm.546-.952l3.624-6.327a1.597 1.597 0 0 1 2.182-.59 1.632 1.632 0 0 1 .615 2.201l-3.519 6.391-2.902-1.675zm-7.73 3.467h3.465a1.123 1.123 0 1 1 0 2.247H3.273a1.123 1.123 0 1 1 0-2.247z"/></svg>';
      this.button.classList.add(this.api.styles.inlineToolButton);
  
      return this.button;
    }
  
    surround(range) {
      if (this.state) {
        this.unwrap(range);
        return;
      }
  
      this.wrap(range);
    }
  
    wrap(range) {
      const selectedText = range.extractContents();
      const mark = document.createElement(this.tag);
  
      mark.classList.add(this.class);
      mark.appendChild(selectedText);
      range.insertNode(mark);
  
      this.api.selection.expandToTag(mark);
    }
  
    unwrap(range) {
      const mark = this.api.selection.findParentTag(this.tag, this.class);
      const text = range.extractContents();
  
      mark.remove();
  
      range.insertNode(text);
    }
  
    showActions(mark) {
        const {backgroundColor} = mark.style;
    
        this.colorPicker.value = backgroundColor ? this.convertToHex(backgroundColor) : '#f5f1cc';
    
        this.colorPicker.onchange = () => {
            mark.style.backgroundColor = this.colorPicker.value;
        };
        this.colorPicker.hidden = false;
    }
    
    convertToHex(color) {
        const rgb = color.match(/(\d+)/g);
        
        let hexr = parseInt(rgb[0]).toString(16);
        let hexg = parseInt(rgb[1]).toString(16);
        let hexb = parseInt(rgb[2]).toString(16);
        
        hexr = hexr.length === 1 ? '0' + hexr : hexr;
        hexg = hexg.length === 1 ? '0' + hexg : hexg;
        hexb = hexb.length === 1 ? '0' + hexb : hexb;
        
        return '#' + hexr + hexg + hexb;
    }
    
    hideActions() {
        this.colorPicker.onchange = null;
        this.colorPicker.hidden = true;
    }
    
    checkState() {
        const mark = this.api.selection.findParentTag(this.tag);
    
        this.state = !!mark;
    
        if (this.state) {
            this.showActions(mark);
        } else {
            this.hideActions();
        }
    }

    renderActions() {
        this.colorPicker = document.createElement('input');
        this.colorPicker.type = 'color';
        this.colorPicker.value = '#f5f1cc';
        this.colorPicker.hidden = true;
    
        return this.colorPicker;
    }
}

const editor = new EditorJS({
    autofocus: true,
    tools: {
        image: {
            class: SimpleImage,
            inlineToolbar: true,
            config: {
                placeholder: 'Paste image URL'
            }
        },
        marker: MarkerTool
    },
    //inlineTool: MarkerTool,
    data: {
        time: 1552744582955,
        blocks: [
        {
            type: "image",
            data: {
            url: "https://onlinejpgtools.com/images/examples-onlinejpgtools/coffee-resized.jpg",
            caption: 'Here is a caption field',
            withBorder: false,
            withBackground: false,
            stretched: false
            }
        }
        ],
        version: "2.11.10"
    }
});

const saveButton = document.getElementById('save-button');
const output = document.getElementById('output');

saveButton.addEventListener('click', () => {
  editor.save().then( savedData => {
    output.innerHTML = JSON.stringify(savedData, null, 4);
  })
})
