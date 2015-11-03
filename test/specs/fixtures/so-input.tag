<so-input>
    <label if={ opts.label } for="theInput">{ opts.label }</label>
    <input id="theInput"
        class={
            'is-invalid': note.type === 1,
            'is-valid': ofMinLength && note.type !== 1
        }>

    <script>
        require('./so-input.js').call(this);
    </script>
</so-input>