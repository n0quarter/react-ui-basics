import React from 'react';
import "./index.css"
import Scrollable, {SCROLLBAR_MODE_HIDDEN} from "../react-ui-basics/Scrollable";

export default {
    title: 'Scrollable',
    component: Scrollable,
};

function createList(size) {
    return [...Array(size)].map((_, i) => ({id: i, label: `value #${i}`}));
}

export const story1 = () => <Scrollable>
    {createList(100).map((item) => <div key={item.id}>{item.label}</div>)}
</Scrollable>;
story1.story = {
    name: 'basic scrollable',
};


class Story2Holder extends React.Component {
    constructor(props) {
        super(props);
        this.state = {list: createList(20)}
    }

    render() {
        const {list} = this.state;
        return <Scrollable onScrolledToBottom={() => {
            console.log('scrolled to bottom')
            setTimeout(() => {
                this.setState({list: createList(this.state.list.length + 10)})
            }, 500)
        }}>
            {list.map((item) => <div key={item.id}>{item.label}</div>)}
        </Scrollable>;
    }
}

export const story2 = () => <Story2Holder/>;
story2.story = {
    name: 'with onScrolledToBottom listener',
};

class Story3Holder extends React.Component {
    constructor(props) {
        super(props);
        this.state = {list: createList(20).reverse()}
    }

    render() {
        const {list} = this.state;
        return <Scrollable ref={it => this.scrollable = it} onScrolledToTop={() => {
            console.log('scrolled to top')
            setTimeout(() => {
                const scrollBeforeUpdate = this.scrollable.getScroll();
                this.scrollable.setScroll(Math.max(scrollBeforeUpdate, 1)) // save scroll position, 0 = scroll to top
                this.setState({list: createList(this.state.list.length + 10).reverse()})
            }, 500)
        }}>
            {list.map((item) => <div key={item.id}>{item.label}</div>)}
        </Scrollable>;
    }

    componentDidMount() {
        this.scrollable.setScroll(this.scrollable.getScrollHeight())
    }
}

export const story3 = () => <Story3Holder/>;
story3.story = {
    name: 'inverted',
};
