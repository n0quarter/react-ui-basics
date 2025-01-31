import React, {Component} from 'react';
import ReactCreateElement from './ReactCreateElement';
import './DroppableList.css'
import DNDDroppable from "./DNDDroppable";
import {classNames, orNoop, setTimeout, NOOP} from "./Tools";
import DNDDraggable from "./DNDDraggable";
import {addListener} from "./DNDContainer";
import {stateGS, setState, propsGetter, props as getProps, render, componentDidUpdate, componentDidMount, children} from "./ReactConstants";

class DroppableList extends Component {

    constructor(properties) {
        super(properties);
        const that = this;
        that.state = {};

        const props = propsGetter(that);
        const resetting = stateGS(that);
        const draggables = {};
        let list;

        const init = () => {
            list = [];
            React.Children.forEach(props()[children], child => {
                child && child.type === DNDDraggable && list.push(getProps(child).id);
            })
        };

        init();

        that[componentDidUpdate] = (prevProps) => {
            if (prevProps[children] !== props()[children]) {
                init();
            }
        };

        let dropped;
        let dragging;
        let oldIndex;
        let newIndex;

        that[componentDidMount] = () => {
            let inTransition = false;
            orNoop(props().provideDraggableEnhancer)(initializer => it => {
                orNoop(initializer)(it);
                it.createPositionListener = (e, style) => {
                    const offsetTop = e.pageY;
                    return e => {
                        e.pageY && (style.transform = 'translateY(' + (e.pageY - offsetTop - that.scrollDiff) + 'px)');
                    };
                };
                it.initDraggedStyles = NOOP;
                it.onDragEnd = () => {
                    const style = it.element.style;
                    inTransition = true;
                    setTimeout(() => {
                        const droppingDuration = props().droppingDuration || 100;
                        style.transition = 'transform ' + droppingDuration + 'ms linear';
                        style.transform = '';
                        style.zIndex = '10';
                        setTimeout(() => {
                            style.transition = '';
                            style.zIndex = '';
                            setTimeout(() => {
                                inTransition = false;
                            }, 50) // ignore mouseenter on the old position
                        }, droppingDuration)
                    }, 1);
                };
                addListener(it.element, it, 'mouseenter', (e) => {
                    !(dragging || inTransition) && setState(it, {hover: true});
                });
                addListener(it.element, it, 'mouseleave', (e) => {
                    !dragging && setState(it, {hover: false});
                });
                it.onUnmount = () => {
                    delete draggables[getProps(it).id];
                };
                draggables[getProps(it).id] = it;
            })

            orNoop(props().provideScrollListener)(e => {
                if (!dragging)
                    return

                that.scrollDiff = that.scroll - orNoop(props().getScrollPosition)() || 0;
            })
        };

        const onHover = (e, draggable) => {
            const y = e.pageY - that.scrollOffsetY - that.scrollDiff;
            const transformUp = 'translateY(' + draggable.height + 'px)';
            const transformDown = 'translateY(-' + draggable.height + 'px)';
            list.forEach((id, i) => {
                if (i !== oldIndex) {
                    const d = draggables[id];
                    const bounds = d.bounds;
                    const style = d.element.style;
                    if (i > oldIndex) {
                        if (y >= bounds.top)
                            style.transform = transformDown;
                        else
                            style.transform = '';
                    } else {
                        if (y <= bounds.bottom)
                            style.transform = transformUp;
                        else
                            style.transform = '';
                    }
                }
            });

            let i = list.findIndex(id => {
                let bounds = draggables[id].bounds;
                return y >= bounds.top && y <= bounds.bottom
            });

            newIndex = i !== -1 ? i : list.length;
        };

        const onDragStart = (e, draggable) => {
            dragging = true;
            dropped = false;
            oldIndex = list.indexOf(getProps(draggable).id);
            that.scrollOffsetY = e.pageY - e.clientY;
            that.scroll = orNoop(props().getScrollPosition)() || 0;
            that.scrollDiff = 0;

            list.forEach((id) => {
                draggables[id].bounds = draggables[id].element.getBoundingClientRect();
            });
        };

        const reset = (ignoredIndex, transition) => {
            list.forEach((id, i) => {
                if (i !== ignoredIndex) {
                    const s = draggables[id].element.style;
                    s.transform = '';
                    s.transition = transition;
                }
            });
        };

        const onDragEnd = (draggable) => {
            const index = list.indexOf(getProps(draggable).id);

            if (dropped) {
                reset(index, '');
            } else {
                resetting(true, () => {
                    reset(index, '');
                });
                setTimeout(() => {
                    resetting(false);
                }, props().droppingDuration || 100);
            }
            dragging = false;
        };
        const onDrop = (data) => {
            dropped = true;
            const draggable = draggables[list[oldIndex]];
            const style = draggable.element.style;

            const diff = (newIndex - oldIndex) * draggable.bounds.height;
            const transform = style.transform;
            const position = transform.substring(11, transform.length - 3);
            style.transform = 'translateY(' + (position - diff) + 'px)'; // set translateY against new position on the list to prevent long slide

            orNoop(props().onDrop)(data, oldIndex, newIndex);

            reset(newIndex, 'unset');
        };

        that[render] = () => {
            const _props = props();
            const {className, initializer} = _props;
            return <DNDDroppable className={classNames(
                'DroppableList',
                className,
                resetting() && 'resetting',
            )}
                                 initializer={initializer}
                                 onHover={onHover}
                                 onDragStart={onDragStart}
                                 onDragEnd={onDragEnd}
                                 onDrop={onDrop}
            >
                {_props[children]}
            </DNDDroppable>;
        };
    }
}


export default DroppableList;