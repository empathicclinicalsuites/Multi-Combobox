(function( $ ) {
    $.widget( "ui.multicombobox", {
        //default options
        options: { },
        
        changeOnSelect: false,
        placeholder: null,
        selectTrack: null,
        inputTrack: null,
        addingArray: [],
        uniqueId: 1,
        selectHTMLId: "",
        
        _create: function() {
            var self = this,
            select = this.element.hide(),
            selected = select.children( ":selected" ),
            value = selected.val() ? selected.text() : "";
            this.selectTrack = select;
            this.placeholder = $("<div style='margin: 4px 8px;' class='placeholder'></div>").insertBefore(select);
            var input = this.input = $( "<input>" )
            .insertAfter( select )
            .val( value )
            .autocomplete({
                delay: 0,
                minLength: 0,
                source: function( request, response ) {
                    var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
                    response( select.children( "option" ).map(function() {
                        var text = $( this ).text();
                        if ( this.value && ( !request.term || matcher.test(text) ) )
                            return {
                                label: text.replace(
                                    new RegExp(
                                        "(?![^&;]+;)(?!<[^<>]*)(" +
                                        $.ui.autocomplete.escapeRegex(request.term) +
                                        ")(?![^<>]*>)(?![^&;]+;)", "gi"
                                        ), "<strong>$1</strong>" ),
                                value: text,
                                option: this
                            };
                    }) );
                },
                select: function( event, ui ) {
                    ui.item.option.selected = true;
                    self._trigger( "selected", event, {
                        item: ui.item.option
                    });
                    self._combodropSelection(ui.item);
                    $( this ).val( "" );
                    return false;
                },
                change: function( event, ui ) {
                    if ( !ui.item ) {
                        var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
                        valid = false;
                        select.children( "option" ).each(function() {
                            if ( $( this ).text().match( matcher ) ) {
                                this.selected = valid = true;
                                return false;
                            }
                        });
                        if ( !valid ) {
                            // remove invalid value, as it didn't match anything
                            $( this ).val( "" );
                            select.val( "" );
                            input.data( "autocomplete" ).term = "";
                            return false;
                        }
                    }
                }
            })
            .addClass( "ui-widget ui-widget-content ui-corner-left" );

            input.data( "autocomplete" )._renderItem = function( ul, item ) {
                return $( "<li></li>" )
                .data( "item.autocomplete", item )
                .append( "<a>" + item.label + "</a>" )
                .appendTo( ul );
            };

            this.button = $( "<button type='button'>&nbsp;</button>" )
            .attr( "tabIndex", -1 )
            .attr( "title", "Show All Items" )
            .insertAfter( input )
            .button({
                icons: {
                    primary: "ui-icon-triangle-1-s"
                },
                text: false
            })
            .removeClass( "ui-corner-all" )
            .addClass( "ui-corner-right ui-button-icon" )
            .click(function() {
                // close if already visible
                if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
                    input.autocomplete( "close" );
                    return;
                }
                // work around a bug (likely same cause as #5265)
                $( this ).blur();

                // pass empty string as value to search for, displaying all results
                input.autocomplete( "search", "" );
                input.focus();
            });
            this.inputTrack = input;
            
            //css to size and position input relative to the button
            $(".ui-button").css("marginLeft","-1px");
            $(".ui-button-icon-only .ui-button-text").css("padding","0.35em");
            $(".ui-autocomplete-input").css("marginRight","0");
            $(".ui-autocomplete-input").css("paddingTop","0.4em");
            $(".ui-autocomplete-input").css("paddingRight","0");
            $(".ui-autocomplete-input").css("paddingBottom","0.4em");
            $(".ui-autocomplete-input").css("paddingLeft","0.45em");
            
            console.log()
            
        },

        destroy: function() {
            this.input.remove();
            this.button.remove();
            this.element.show();
            $.Widget.prototype.destroy.call( this );
        },
        
        clearSelections: function() {
            this.placeholder.remove();
            this.placeholder = $("<div style='margin: 4px 8px;' class='placeholder'></div>").insertBefore(this.selectTrack);
            
            this.inputTrack.val( "" );
            
            var optionElements = $(this.selectTrack).children();
            for (i=0;i<optionElements.length;i++){
                optionElements[i].selected = false;
            }
            
            this.addingArray = [];
        },
        
        _inArray: function(object, array) {
            for (i=0;i<array.length;i++){
                if (array[i]==object) return true;
            }
            return false;
        },
        
        _removeByElement: function(object, array) {
            for(var i=0; i<array.length;i++ ){
                if(array[i]==object) array.splice(i,1); 
            }
            return;
        },
        
        _combodropSelection: function(itemSelected) {
            var self = this;
            
            var name = itemSelected.value;
            var selectForm = itemSelected.option.parentNode;
            var selectFormId = $(selectForm).attr("id");
            var selectIdPound = "#" + selectFormId;
            
            if (!this._inArray(name,this.addingArray)) {
                this.addingArray.push(name);
                var divNameId = "addedNameId" + this.uniqueId + selectFormId;
                var deleterId = "deleteId" + this.uniqueId + selectFormId;
                this.placeholder.append('<div style="padding:3px 6px; margin-bottom:5px; background-color: #F5F5F5; color:#555;" id="'+ divNameId +'" class="addedName ui-state-error-text"><p style="float:left; width:160px; margin:4px 0;font-size:.9em;" class="addedName">'+ name +'</p><input id="'+ deleterId +'" class="deleteButton ui-icon ui-icon-circle-close" type="button" title="Remove" value="" style="background-color: #F5F5F5; float: right; width: 16px; border:none;margin-top:3px;"/><div style="clear:both;"></div></div>');
                
                $('#'+deleterId).click(function(){
                    self._combodropDeletion(name,"#"+divNameId,selectIdPound);
                });
                
                //ui hover state currently removes icon, which is not desired
//                $('#'+deleterId).mouseover(function(){
//                    $('#'+deleterId).addClass("ui-state-hover");
//                });
//                $('#'+deleterId).mouseout(function(){
//                    $('#'+deleterId).removeClass("ui-state-hover");
//                });
                //so instead, just changing the icon to a pointer
                $('#'+deleterId).mouseover(function(){
                    $('#'+deleterId).css('cursor','pointer');
                });
                $('#'+deleterId).mouseout(function(){
                    $('#'+deleterId).css('cursor','auto');
                });
                
                this.uniqueId = this.uniqueId + 1;
            }
        },
        
        _combodropDeletion: function(name, divId, selectId) {
            //removes the html element above the combobox that displays the selections
            $(divId).remove();
  
            //remove from array
            this._removeByElement(name,this.addingArray);
            //get the html option elements from the select html element id
            var optionElements = $(selectId).children();
            //cycle through all possible selections to see if any of the text feilds match the name
            for (i=0;i<optionElements.length;i++){
                if (optionElements[i].text == name) {
                    //deslects the specific name
                    optionElements[i].selected = false;
                }
            }
        }
    });
})( jQuery );