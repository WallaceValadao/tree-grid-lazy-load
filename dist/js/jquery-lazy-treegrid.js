(function ($) {
    $.fn.lazytreegrid = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return _initTree.apply(this, arguments);
        } else {
            $.error('Method with name ' + method + ' does not exists for jQuery.treegrid');
        }
    };

    $.fn.lazytreegrid.defaults = {
        source: null, //Function(id, complete)|Url Result should be in add() function format. For Url 'json' format is used.
        moveHandle: false, //Selector|Element Restricts moving start click to the specified element.
        onExpand: function () { return true; }, //Function() Calling when node expands. Return false if you dont want the node been expanded.
        onCollapse: function () { return true; }, //Function() Calling when node collapses. Return false if you dont want the node been collapsed.
        onAdd: function () { }, //Function(items) Calling when nodes was added. Returns jQuery container that contains all added nodes.
        toExpand: function () { },
        toCollapse: function () { },
        iconOpen: 'fa-caret-right',
        iconClose: 'fa-caret-down',
        invisibleLine: 'd-none',
        defaulIconIsNull: false,
        onActionExpand: null,
        maxNivelTree: 3,
        multiEspaceNivel: 10,
        arrayNivelBackgroundColor: null,
        arrayNivelBackgroundColor2: null,
        arrayNivelTextColor: null,
        marginExpand: '0.6rem',
        startExpanded: true,
        useTableLess: true
    };

    var methods = {
        add: function (id, arrayHtml) {
            let options = $.fn.lazytreegrid.settings;
            var $tr_s = this._getTrs();
            var tr;

            for (var i = 0; i < $tr_s.length; i++) {
                if ($tr_s[i].getAttribute('id-tree') === id) {
                    tr = $tr_s[i];
                    break;
                }
            }
            let $tr = $(tr);
            let father = $tr.find('.tree-click')[0];

            var level = father.getAttribute('level');
            level++;

            let mg = level * options.multiEspaceNivel + 'px;';

            var click = '';

            var funcRemoveTd = function () { };

            if (level < options.maxNivelTree) {
                click = getClickOpen(options, mg);
            } else {
                click = '<div style="margin-left:'.concat(mg, '";>');

                funcRemoveTd = function (htmlTd) {
                    htmlTd.find('td').removeClass('tree-click');
                };
            }

            for (i = 0; i < arrayHtml.length; i++) {
                var html = $(arrayHtml[i]);
                html = setStyleTr(options, html, level, i);

                var fClick = setLevelClick(html, level);
                fClick.innerHTML = click.concat(fClick.innerHTML, '</div>');

                funcRemoveTd(html);

                $tr.after(html);
            }

            $tr.parent().find('.tree-click').unbind('click').click(clickExpand);
            options.onAdd();
        },

        getAllParent: function (idSon) {
            var $tr_s = this._getTrs();

            var result = this._getIds(idSon, $tr_s);
            result.push(idSon);

            return result;
        },

        _getIds: function (id, trs) {
            for (var i = 0; i < trs.length; i++) {
                if (trs[i].getAttribute('id-tree') === id) {
                    var novoId = trs[i].getAttribute('id-parent');

                    if (!novoId || novoId === '0') {
                        return [novoId];
                    }

                    var novoArray = this._getIds(novoId, trs);
                    novoArray.push(novoId);

                    return novoArray;
                }
            }
        },
        _getTrs: function () {
            return $.fn.lazytreegrid.this.find($.fn.lazytreegrid.settings.table.body).find($.fn.lazytreegrid.settings.table.tr);
        }
    };

    function _initTree(options) {
        var $this = $(this), settings = $.extend({}, $.fn.lazytreegrid.defaults, options);
        $.fn.lazytreegrid.settings = settings;

        if (settings.useTableLess) {
            settings.table = {
                body: '.table-tree-body',
                tr: '.table-tree-tr'
            };
        } else {
            settings.table = {
                body: 'tbody',
                tr: 'tr'
            };
        }

        var $body = $this.find(settings.table.body);
        var $tr_s = $body.find(settings.table.tr);

        $tr_s.remove();

        if ($tr_s.length === 0)
            return;

        var trf;
        for (var i = 0; i < $tr_s.length; i++) {
            trf = $tr_s[i];

            if (!trf.getAttribute('id-parent')) {

                $tr_s.splice(i, 1);

                break;
            }
            trf = null;
        }
        if (!trf)
            $.error('Tr init not found');

        $body.append(trf);
        orderTree(settings, $body, trf, $tr_s, 0, 0);

        $this.find('.tree-click').click(clickExpand);

        $.fn.lazytreegrid.this = $this;
    }

    function clickExpand() {
        var options = $.fn.lazytreegrid.settings;

        if (!options.onExpand()) {
            return;
        }

        let $this = $(this);
        let $parent = $this.parent();
        var $span = $this.find('svg');
        let idAtual = $parent[0].getAttribute('id-tree');
        var iconOpen = $span.hasClass(options.iconOpen);

        if ($this.hasClass('load-tree')) {
            if (!$this.hasClass('any-tree')) {

                var $trs = $parent.parent().find(options.table.tr);
                var funTr;

                if (iconOpen) {
                    $span.removeClass(options.iconOpen).addClass(options.iconClose);

                    funTr = function (tr, trs, itemLoop) {
                        tr.classList.remove(options.invisibleLine);

                        if (tr.classList.contains('item-tree-open')) {
                            var idAtualFilho = trs[itemLoop].getAttribute('id-tree');

                            tr.classList.remove('item-tree-open');


                            var svg = tr.querySelector('svg');

                            if (!(!svg || svg.classList.contains(options.iconClose))) {
                                return;
                            }

                            for (itemLoop++; itemLoop < trs.length; itemLoop++) {
                                if (trs[itemLoop].getAttribute('id-parent') === idAtualFilho) {
                                    funTr(trs[itemLoop], trs, itemLoop);
                                } 
                            }
                        }
                    };
                } else {
                    $span.addClass(options.iconOpen).removeClass(options.iconClose);

                    funTr = function (tr, trs, itemLoop) {
                        tr.classList.add(options.invisibleLine);

                        var idAtualFilho = tr.getAttribute('id-tree');

                        for (itemLoop++; itemLoop < trs.length; itemLoop++) {
                            if (trs[itemLoop].getAttribute('id-parent') === idAtualFilho) {
                                tr.classList.add('item-tree-open');
                                funTr(trs[itemLoop], trs, itemLoop);
                            }
                        }
                    };
                }

                var addAny = true;

                for (var i = 0; i < $trs.length; i++) {
                    if ($trs[i].getAttribute('id-parent') === idAtual) {
                        funTr($trs[i], $trs, i);
                        addAny = false;
                    }
                }

                if (addAny) {
                    $this.addClass('any-tree');
                }
            }
        } else if (iconOpen) {
            $span.removeClass(options.iconOpen).addClass(options.iconClose);

            $this.addClass('load-tree');

            options.onActionExpand(idAtual, methods);
        } else {
            $this.addClass('any-tree');
        }
    }

    function setStyleTr(options, $tr, level, valueI) {
        if (valueI % 2 === 1) {
            $tr.css('background', options.arrayNivelBackgroundColor[level]);
        }
        else {
            $tr.css('background', options.arrayNivelBackgroundColor2[level]);
        }

        if (options.arrayNivelTextColor !== null) {
            $tr.css('color', options.arrayNivelTextColor[level]);
        }

        return $tr;
    }

    function setLevelClick($tr, level) {
        var fClick = $tr.find('.tree-click')[0];
        fClick.setAttribute('level', level);
        return fClick;
    }

    function orderTree(options, $body, trfather, trs, level, valueI) {
        var idFather = trfather.getAttribute('id-tree');
        var $trfather = $(trfather);

        let mg = level * options.multiEspaceNivel + 'px;';

        $trfather = setStyleTr(options, $trfather, level, valueI);

        var fClick = setLevelClick($trfather, level);

        level++;
        var isExist = false;
        for (var i = 0; i < trs.length; i++) {
            if (trs[i].getAttribute('id-parent') === idFather) {
                var novo = trs.slice(0).splice(i, 1);

                $body.append(trs[i]);

                orderTree(options, $body, trs[i], novo, level, i);

                isExist = true;
            }
        }

        if (isExist) {
            fClick.innerHTML = getClickClose(options, mg).concat(fClick.innerHTML);
            fClick.classList.add('load-tree');
        } else {
            fClick.innerHTML = getClickOpen(options, mg).concat(fClick.innerHTML);
        }
    }

    function getClickClose(options, mg) {
        return '<div style="margin-left:'.concat(mg, '";><span class="fa ', options.iconClose, '" style="cursor: pointer; margin-right: ', options.marginExpand, ';"></span>');
    }

    function getClickOpen(options, mg) {
        return '<div style="margin-left:'.concat(mg, '";><span class="fa ', options.iconOpen, '" style="cursor: pointer; margin-right: ', options.marginExpand, ';"></span>');
    }
})(jQuery);