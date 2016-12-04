<css-apply>
  <p>should have riot color</p>
  <div>should be applied riot theme</p>

  <style>
    :scope {
      display: block;
      --riot-theme: {
        color: white;
        background-color: #F04;
      };
      --riot-color: #F04;
    }
    p {
      border: solid 1px black;
      color: var(--riot-color);
    }
    div {
      @apply --riot-theme;
    }
  </style>
</css-apply>
